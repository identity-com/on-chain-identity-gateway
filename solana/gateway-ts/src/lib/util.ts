import {
  AccountInfo,
  Commitment,
  Connection,
  GetProgramAccountsConfig,
  PublicKey,
  RpcResponseAndContext,
  SendOptions,
  SignatureResult,
  Signer,
  Transaction,
} from "@solana/web3.js";
import {
  GATEKEEPER_NONCE_SEED_STRING,
  GATEWAY_TOKEN_ADDRESS_SEED,
  PROGRAM_ID,
  SOLANA_COMMITMENT,
  SOLANA_TIMEOUT_CONFIRMED,
  SOLANA_TIMEOUT_FINALIZED,
  SOLANA_TIMEOUT_PROCESSED,
  DEFAULT_SOLANA_RETRIES,
} from "./constants";
import {
  DeepPartial,
  GatewayToken,
  ProgramAccountResponse,
  State,
} from "../types";
import { GatewayTokenData, GatewayTokenState } from "./GatewayTokenData";
import retry from "async-retry";
import * as R from "ramda";

export type RetryConfig = {
  retryCount: number;
  exponentialFactor: number;
  timeouts: {
    processed: number;
    confirmed: number;
    finalized: number;
  };
};

export const defaultRetryConfig = {
  retryCount: DEFAULT_SOLANA_RETRIES,
  exponentialFactor: 2,
  timeouts: {
    processed: SOLANA_TIMEOUT_PROCESSED,
    confirmed: SOLANA_TIMEOUT_CONFIRMED,
    finalized: SOLANA_TIMEOUT_FINALIZED,
  },
};

export const runFunctionWithRetry = async (
  fn: () => Promise<unknown>,
  commitment: Commitment,
  customRetryConfig: DeepPartial<RetryConfig>
): Promise<unknown> => {
  const retryConfig = {
    ...defaultRetryConfig,
    ...customRetryConfig,
  } as RetryConfig;

  let timeout: number =
    R.path(["timeouts", commitment], retryConfig) ||
    retryConfig.timeouts.confirmed;

  // If we have any bugs before this point, this is the final safeguard against undefined retry config values.
  // TODO IDCOM-1558 Improve the type safety of config to avoid the need for checks such as this.
  let retryCount = retryConfig.retryCount;
  let expFactor = retryConfig.exponentialFactor;
  if (!retryCount) {
    console.error(
      `retryCount not set in Solana connection proxy. Defaulting to ${DEFAULT_SOLANA_RETRIES}`
    );
    retryCount = DEFAULT_SOLANA_RETRIES;
  }

  if (!expFactor) {
    console.error(
      "exponentialFactor not set in Solana connection proxy. Defaulting to 2"
    );
    retryCount = 2;
  }

  if (!timeout) {
    console.error(
      `timeout not set in Solana connection proxy. Defaulting to ${SOLANA_TIMEOUT_CONFIRMED}`
    );
    timeout = SOLANA_TIMEOUT_CONFIRMED;
  }

  let currentAttempt = 0;

  return retry(
    async () => {
      currentAttempt++;
      console.log(
        `Trying Solana blockchain call (attempt ${currentAttempt} of ${
          retryConfig.retryCount + 1
        })`,
        { timeout }
      );
      const timeoutPromise = new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeout)
      );
      const blockchainPromise = fn();
      return Promise.race([blockchainPromise, timeoutPromise]);
    },
    {
      retries: retryCount,
      factor: expFactor,
    }
  );
};

export const proxyConnectionWithRetry = (
  originalConnection: Connection,
  customRetryConfig: DeepPartial<RetryConfig> = defaultRetryConfig
): Connection => {
  const proxyHandler: ProxyHandler<Connection> = {
    get(target: Connection, propKey, receiver) {
      switch (propKey) {
        case "sendTransaction":
          return (
            transaction: Transaction,
            signers: Signer[],
            options: SendOptions | undefined
          ): Promise<string> => {
            const fn = async () =>
              target.sendTransaction(transaction, signers, options);
            return runFunctionWithRetry(
              fn,
              SOLANA_COMMITMENT,
              customRetryConfig
            ) as Promise<string>;
          };
        case "confirmTransaction":
          return (
            signature: string,
            commitment?: Commitment | undefined
          ): Promise<RpcResponseAndContext<SignatureResult>> => {
            const fn = async () =>
              target.confirmTransaction(signature, commitment);
            return runFunctionWithRetry(
              fn,
              SOLANA_COMMITMENT,
              customRetryConfig
            ) as Promise<RpcResponseAndContext<SignatureResult>>;
          };
        case "getProgramAccounts":
          return (
            programId: PublicKey,
            configOrCommitment?:
              | Commitment
              | GetProgramAccountsConfig
              | undefined
          ): Promise<
            {
              pubkey: PublicKey;
              account: AccountInfo<Buffer>;
            }[]
          > => {
            const fn = async () =>
              target.getProgramAccounts(programId, configOrCommitment);
            return runFunctionWithRetry(
              fn,
              SOLANA_COMMITMENT,
              customRetryConfig
            ) as Promise<
              {
                pubkey: PublicKey;
                account: AccountInfo<Buffer>;
              }[]
            >;
          };
        case "getAccountInfo":
          return (
            publicKey: PublicKey,
            commitment?: Commitment | undefined
          ): Promise<AccountInfo<Buffer> | null> => {
            const fn = async () => target.getAccountInfo(publicKey, commitment);
            return runFunctionWithRetry(
              fn,
              SOLANA_COMMITMENT,
              customRetryConfig
            ) as Promise<AccountInfo<Buffer> | null>;
          };
        default:
          // Return the original property unchanged:
          return Reflect.get(target, propKey, receiver);
      }
    },
    apply(target: any, thisArg, argumentsList) {
      const fn = async () => target.apply(thisArg, argumentsList);
      return runFunctionWithRetry(fn, SOLANA_COMMITMENT, customRetryConfig);
    },
  };
  return new Proxy<Connection>(originalConnection, proxyHandler);
};

/**
 * Derive the address of the gatekeeper PDA for this gatekeeper
 * @param authority The gatekeeper
 * @param network The network
 */
export const getGatekeeperAccountKey = async (
  authority: PublicKey,
  network: PublicKey
): Promise<PublicKey> => {
  const publicKeyNonce = await PublicKey.findProgramAddress(
    [
      authority.toBuffer(),
      network.toBuffer(),
      Buffer.from(GATEKEEPER_NONCE_SEED_STRING, "utf8"),
    ],
    PROGRAM_ID
  );
  return publicKeyNonce[0];
};

/**
 * Derive the address of the gateway token PDA for this owner address and optional seed.
 * @param owner The owner of the gateway token
 * @param gatekeeperNetwork The network of the gateway token
 * @param seed An 8-byte seed array, used to add multiple tokens to the same owner. Must be unique to each token, if present
 */
export const getGatewayTokenKeyForOwner = async (
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  seed?: Uint8Array
): Promise<PublicKey> => {
  const additionalSeed = seed
    ? Buffer.from(seed)
    : Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]);
  if (additionalSeed.length != 8) {
    throw new Error(
      "Additional Seed has length " +
        additionalSeed.length +
        " instead of 8 when calling getGatewayTokenKeyForOwner."
    );
  }
  const seeds = [
    owner.toBuffer(),
    Buffer.from(GATEWAY_TOKEN_ADDRESS_SEED, "utf8"),
    additionalSeed,
    gatekeeperNetwork.toBuffer(),
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

export const dataToGatewayToken = (
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
 * @param connection A solana connection object
 * @param owner The token owner
 * @param gatekeeperNetwork The network to find a token for
 * @param {boolean=false} includeRevoked If false (default), filter out revoked tokens
 * @returns {Promise<GatewayToken[]>} All tokens for the owner
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
  const tokens = await findGatewayTokens(
    connection,
    owner,
    gatekeeperNetwork,
    false
  );

  if (tokens.length === 0) return null;

  // if any are valid, return the first one
  const validTokens = tokens.filter((token) => token.isValid());
  if (validTokens.length > 0) return validTokens[0];

  // if none is valid, return the first non-revoked one
  const nonRevokedTokens = tokens.filter(
    (token) => token.state !== State.REVOKED
  );

  return nonRevokedTokens.length === 0 ? null : nonRevokedTokens[0];
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
 * Stops listening to gateway state changes
 * @param connection A solana connection object
 * @param id The subscription id to deregister
 */
export const removeAccountChangeListener = (
  connection: Connection,
  id: number
): Promise<void> => connection.removeAccountChangeListener(id);

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
 * Returns whether or not a gatekeeper exists from a network and authority
 * @param connection A solana connection
 * @param gatekeeperAuthority The authority of the gatekeeper
 * @param gatekeeperNetwork The network of the gatekeeper
 */
export const gatekeeperExists = async (
  connection: Connection,
  gatekeeperAuthority: PublicKey,
  gatekeeperNetwork: PublicKey
): Promise<boolean> => {
  const gatekeeperAccount = await getGatekeeperAccountKey(
    gatekeeperAuthority,
    gatekeeperNetwork
  );
  const account = await connection.getAccountInfo(
    gatekeeperAccount,
    SOLANA_COMMITMENT
  );

  return account != null && account.owner == PROGRAM_ID;
};
