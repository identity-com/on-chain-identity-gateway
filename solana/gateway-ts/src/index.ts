import {
  AccountInfo,
  Commitment,
  Connection,
  GetProgramAccountsFilter,
  PublicKey,
} from "@solana/web3.js";
import { GatewayToken, ProgramAccountResponse, State } from "./types";
import { encode } from "bs58";
import { PROGRAM_ID, SOLANA_COMMITMENT } from "./lib/constants";
import { GatewayTokenData } from "./lib/GatewayTokenData";
import * as R from "ramda";
import { NetworkFeature } from "./lib/GatewayNetworkData";
import {
  dataToGatewayToken,
  GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET,
  GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
  getFeatureAccountAddress,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
} from "./lib/util";

export * from "./lib/instruction";
export * from "./lib/util";
export * from "./lib/GatewayTokenData";
export * from "./lib/GatewayNetworkData";
export * from "./types";
export * from "./lib/constants";
export * from "./lib/AssignablePublicKey";

/**
 * Find all gateway tokens (optionally for a user) on a gatekeeper network, optionally filtering out revoked tokens.
 *
 * Warning - this uses the Solana getProgramAccounts RPC endpoint, which is inefficient and may be
 * blocked by some RPC services.
 *
 * @param connection A solana connection object
 * @param owner The token owner (optional)
 * @param gatekeeperNetwork The network to find a token for
 * @param {boolean=false} includeRevoked If false (default), filter out revoked tokens
 * @param page If a large number of tokens has been issued, the request to the RPC endpoint may time out.
 * In this case, enable pagination by setting page variable
 * Pagination is not supported in the RPC API per-se, but this approximates it by
 * adding another filter on the first byte of the owner address.
 * Each page requests the accounts that match that byte.
 * @returns {Promise<GatewayToken[]>} All tokens for the owner
 */
export const findGatewayTokens = async (
  connection: Connection,
  owner: PublicKey | undefined,
  gatekeeperNetwork: PublicKey,
  includeRevoked = false,
  page?: number
): Promise<GatewayToken[]> => {
  // if owner is specified, filter on the gateway token owner
  const ownerFilter = owner
    ? {
        memcmp: {
          offset: GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
          bytes: owner.toBase58(),
        },
      }
    : undefined;

  // filter on the gatekeeper network
  const gatekeeperNetworkFilter = {
    memcmp: {
      offset: GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET,
      bytes: gatekeeperNetwork.toBase58(),
    },
  };

  const pageFilter =
    page !== undefined
      ? {
          memcmp: {
            offset: GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
            bytes: encode([page]),
          },
        }
      : undefined;

  const filters = [ownerFilter, gatekeeperNetworkFilter, pageFilter].filter(
    Boolean
  ) as GetProgramAccountsFilter[];

  const accountsResponse = await connection.getProgramAccounts(PROGRAM_ID, {
    filters,
  });

  if (!accountsResponse) return [];

  const toGatewayToken = ({
    pubkey,
    account,
  }: ProgramAccountResponse): GatewayToken =>
    dataToGatewayToken(GatewayTokenData.fromAccount(account.data), pubkey);

  return accountsResponse
    .map(toGatewayToken)
    .filter(
      (gatewayToken) => gatewayToken.state !== State.REVOKED || includeRevoked
    );
};

/**
 * Finds all gateway tokens for a user by iterating through the index seed
 * and requesting a page of addresses at a time.
 *
 * It assumes a small number of passes per GKN, so the page size by default is 5.
 * Sorts the result by active status and expiry, so unexpired active passes appear first
 * @param connection
 * @param owner
 * @param gatekeeperNetwork
 * @param includeRevoked
 * @param offset
 * @param page
 */
export const findGatewayTokensForOwnerAndNetwork = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  includeRevoked = false,
  offset = 0,
  page = 5 // by default, assume a user has max five GTs for a given network
): Promise<GatewayToken[]> => {
  const addresses = await Promise.all(
    R.range(offset, offset + page).map((index) =>
      getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        gatekeeperNetwork,
        index
      )
    )
  );

  const rawAccounts = await connection.getMultipleAccountsInfo(
    addresses,
    SOLANA_COMMITMENT
  );

  return (
    rawAccounts
      // link the address to the account
      .map((account, index): [AccountInfo<Buffer> | null, PublicKey] => [
        account,
        addresses[index],
      ])
      // filter out null accounts
      .filter(
        (tuple): tuple is [AccountInfo<Buffer>, PublicKey] => tuple[0] !== null
      )
      // convert to GatewayToken
      .map(([account, gatewayTokenAddress]) =>
        dataToGatewayToken(
          GatewayTokenData.fromAccount(account.data),
          gatewayTokenAddress
        )
      )
      // Filter out revoked GTs if requested
      .filter((gt) => gt.state !== State.REVOKED || includeRevoked)
      // sort by active status
      .sort((a, b) => (a.isValid() === b.isValid() ? 0 : a.isValid() ? -1 : 1))
  );
};

/**
 * Get a gateway token for the owner and network, if it exists.
 * @param connection A solana connection object
 * @param owner The token owner
 * @param gatekeeperNetwork The network to find a token for
 * @returns Promise<GatewayToken | null> An unrevoked token, if one exists for the owner
 */
export const findGatewayToken = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey
): Promise<GatewayToken | null> => {
  const gatewayTokens = await findGatewayTokensForOwnerAndNetwork(
    connection,
    owner,
    gatekeeperNetwork
  );

  return gatewayTokens.length > 0 ? gatewayTokens[0] : null;
};

/**
 * Register a callback to be called whenever a gateway token changes state
 * @param connection A solana connection object
 * @param gatewayTokenAddress The address of the gateway token
 * @param callback The callback to register
 * @param commitment The solana commitment level at which to register gateway token changes. Defaults to 'confirmed'
 * @return The subscription id
 */
export const onGatewayTokenChange = (
  connection: Connection,
  gatewayTokenAddress: PublicKey,
  callback: (gatewayToken: GatewayToken) => void,
  commitment: Commitment = SOLANA_COMMITMENT
): number => {
  const accountCallback = (accountInfo: AccountInfo<Buffer>) => {
    const gatewayToken = dataToGatewayToken(
      GatewayTokenData.fromAccount(accountInfo.data),
      gatewayTokenAddress
    );
    callback(gatewayToken);
  };
  return connection.onAccountChange(
    gatewayTokenAddress,
    accountCallback,
    commitment
  );
};

/**
 * Register a callback to be called whenever a gateway token is created or changes state
 * @param connection A solana connection object
 * @param owner The gateway token owner
 * @param gatekeeperNetwork
 * @param callback The callback to register
 * @param commitment The solana commitment level at which to register gateway token changes. Defaults to 'confirmed'
 * @param seed
 * @return The subscription id
 */
export const onGatewayToken = (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  callback: (gatewayToken: GatewayToken) => void,
  commitment: Commitment = SOLANA_COMMITMENT,
  seed = 0
): number => {
  const gatewayTokenAddress =
    getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
      owner,
      gatekeeperNetwork,
      seed
    );

  return onGatewayTokenChange(
    connection,
    gatewayTokenAddress,
    callback,
    commitment
  );
};

/**
 * Lookup the gateway token at a given address
 * @param connection A solana connection object
 * @param gatewayTokenAddress The address of the gateway token
 */
export const getGatewayToken = async (
  connection: Connection,
  gatewayTokenAddress: PublicKey
): Promise<GatewayToken | null> => {
  const account = await connection.getAccountInfo(
    gatewayTokenAddress,
    SOLANA_COMMITMENT
  );

  if (!account) return null;

  return dataToGatewayToken(
    GatewayTokenData.fromAccount(account.data),
    gatewayTokenAddress
  );
};

/**
 * Return true if an address feature exists.
 * @param connection
 * @param feature The feature to check
 * @param network The gatekeeper network
 */
export const featureExists = async (
  connection: Connection,
  feature: NetworkFeature,
  network: PublicKey
): Promise<boolean> => {
  const featureAccountAddress = getFeatureAccountAddress(feature, network);

  const account = await connection.getAccountInfo(
    featureAccountAddress,
    SOLANA_COMMITMENT
  );

  return account != null && PROGRAM_ID.equals(account.owner);
};
