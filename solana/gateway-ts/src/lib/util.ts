import { Connection, PublicKey } from "@solana/web3.js";
import {
  GATEKEEPER_NONCE_SEED_STRING,
  GATEWAY_TOKEN_ADDRESS_SEED,
  PROGRAM_ID,
  SOLANA_COMMITMENT,
} from "./constants";
import { GatewayToken, ProgramAccountResponse, State } from "../types";
import { GatewayTokenData, GatewayTokenState } from "./GatewayTokenData";
import { GatekeeperData } from "./GatekeeperData";

export const getGatekeeperAccountKeyFromGatekeeperAuthority = async (
  authority: PublicKey
): Promise<PublicKey> => {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [authority.toBuffer(), Buffer.from(GATEKEEPER_NONCE_SEED_STRING, "utf8")],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
};

export const getGatewayTokenKeyForOwner = async (
  owner: PublicKey,
  seed?: Uint8Array
): Promise<PublicKey> => {
  const additionalSeed = seed
    ? Buffer.from(seed)
    : Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
  const seeds = [
    owner.toBuffer(),
    Buffer.from(GATEWAY_TOKEN_ADDRESS_SEED, "utf8"),
    additionalSeed,
  ];

  const publicKeyNonce = await PublicKey.findProgramAddress(seeds, PROGRAM_ID);
  return publicKeyNonce[0];
};

// Based on solana/integration-lib/src/state.rs
// If the optional the parent-gateway-token field is populated, this value will be
// 34 (2 + 32) instead. TODO IDCOM-320 restructure the gateway token accounts to put
// all optional values at the end of the struct to simplify account parsing a little
const GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET = 2;
// As above, if optional fields are present, this will differ. TODO IDCOM-320 fixes this
const GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET = 35;

function fromGatewayTokenState(state: GatewayTokenState): State {
  if (!!state.active) return State.ACTIVE;
  if (!!state.revoked) return State.REVOKED;
  if (!!state.frozen) return State.FROZEN;

  throw new Error("Unrecognised state " + JSON.stringify(state));
}

const dataToGatewayToken = (
  data: GatewayTokenData,
  publicKey: PublicKey
): GatewayToken =>
  new GatewayToken(
    data.issuingGatekeeper.toPublicKey(),
    data.gatekeeperNetwork.toPublicKey(),
    data.owner.toPublicKey(),
    fromGatewayTokenState(data.state),
    publicKey,
    PROGRAM_ID,
    data.expiry?.toNumber()
  );

/**
 * Find all gateway tokens for a user on a gatekeeper network, optionally filtering out revoked tokens
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} gatekeeperNetwork
 * @param {boolean=false} includeRevoked
 * @returns {Promise<GatewayToken[]>}
 */
export const findGatewayTokens = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  includeRevoked = false
): Promise<GatewayToken[]> => {
  const ownerFilter = {
    memcmp: {
      offset: GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET,
      bytes: owner.toBase58(),
    },
  };
  const gatekeeperNetworkFilter = {
    memcmp: {
      offset: GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET,
      bytes: gatekeeperNetwork?.toBase58(),
    },
  };
  const filters = [ownerFilter, gatekeeperNetworkFilter];
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
 * Find any unrevoked token for a user on a gatekeeper network
 * @param {Connection} connection
 * @param {PublicKey} owner
 * @param {PublicKey} gatekeeperNetwork
 * @returns {Promise<GatewayToken | undefined>}
 */
export const findGatewayToken = async (
  connection: Connection,
  owner: PublicKey,
  gatekeeperNetwork: PublicKey
): Promise<GatewayToken | null> => {
  const [token] = await findGatewayTokens(
    connection,
    owner,
    gatekeeperNetwork,
    false
  );
  return token;
};

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

export const getGatekeeperAccount = async (
  connection: Connection,
  gatekeeperAuthority: PublicKey
): Promise<GatekeeperData | null> => {
  const gatekeeperAccount =
    await getGatekeeperAccountKeyFromGatekeeperAuthority(gatekeeperAuthority);
  const account = await connection.getAccountInfo(
    gatekeeperAccount,
    SOLANA_COMMITMENT
  );

  if (!account) return null;

  return GatekeeperData.fromAccount(account.data);
};
