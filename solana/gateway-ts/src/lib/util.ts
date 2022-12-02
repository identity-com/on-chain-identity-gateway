import { Connection, PublicKey } from "@solana/web3.js";
import {
  GATEKEEPER_NONCE_SEED_STRING,
  GATEWAY_TOKEN_ADDRESS_SEED,
  PROGRAM_ID,
  SOLANA_COMMITMENT,
} from "./constants";
import { GatewayToken, State } from "../types";
import { GatewayTokenData, GatewayTokenState } from "./GatewayTokenData";
import { mapEnumToFeatureName, NetworkFeature } from "./GatewayNetworkData";

/**
 * Derive the address of the gatekeeper PDA for this gatekeeper
 * @param authority The gatekeeper
 * @param network The network
 */
export const getGatekeeperAccountAddress = (
  authority: PublicKey,
  network: PublicKey
): PublicKey =>
  PublicKey.findProgramAddressSync(
    [
      authority.toBuffer(),
      network.toBuffer(),
      Buffer.from(GATEKEEPER_NONCE_SEED_STRING, "utf8"),
    ],
    PROGRAM_ID
  )[0];

/**
 * Derive the address of the gateway token PDA for this owner address and optional seed.
 * @param owner The owner of the gateway token
 * @param gatekeeperNetwork The network of the gateway token
 * @param index The index of the gateway token (default 0)
 */
export const getGatewayTokenAddressForOwnerAndGatekeeperNetwork = (
  owner: PublicKey,
  gatekeeperNetwork: PublicKey,
  index = 0
): PublicKey => {
  // The index is converted to an 8-byte uint array. Ensure no overflow here.
  if (index > 2 ** (8 * 8)) {
    throw new Error(
      "index must be < max(8 bytes) when calling getGatewayTokenAddressForOwnerAndGatekeeperNetwork."
    );
  }

  const seed = numToBuffer(index);
  const paddedSeed = Buffer.concat([Buffer.alloc(8 - seed.length, 0), seed]);

  if (paddedSeed.length > 8) {
    throw new Error(
      "Seed has length " +
        paddedSeed.length +
        " instead of 8 when calling getGatewayTokenAddressForOwnerAndGatekeeperNetwork."
    );
  }
  const seeds = [
    owner.toBuffer(),
    Buffer.from(GATEWAY_TOKEN_ADDRESS_SEED, "utf8"),
    paddedSeed,
    gatekeeperNetwork.toBuffer(),
  ];

  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
};

// Based on solana/integration-lib/src/state.rs
// If the optional the parent-gateway-token field is populated, this value will be
// 34 (2 + 32) instead. TODO IDCOM-320 restructure the gateway token accounts to put
// all optional values at the end of the struct to simplify account parsing a little
export const GATEWAY_TOKEN_ACCOUNT_OWNER_FIELD_OFFSET = 2;

// As above, if optional fields are present, this will differ. TODO IDCOM-320 fixes this
export const GATEWAY_TOKEN_ACCOUNT_GATEKEEPER_NETWORK_FIELD_OFFSET = 35;

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
 * Stops listening to gateway state changes
 * @param connection A solana connection object
 * @param id The subscription id to deregister
 */
export const removeAccountChangeListener = (
  connection: Connection,
  id: number
): Promise<void> => connection.removeAccountChangeListener(id);

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
  const gatekeeperAccount = getGatekeeperAccountAddress(
    gatekeeperAuthority,
    gatekeeperNetwork
  );
  const account = await connection.getAccountInfo(
    gatekeeperAccount,
    SOLANA_COMMITMENT
  );

  return account != null && PROGRAM_ID.equals(account.owner);
};

/**
 * Converts a number to a buffer of U8 integers, for use in the gateway token address
 * derivation as the seed value.
 * @param num
 */
export const numToBuffer = (num: number): Buffer => {
  const numToArray = (num: number, arr: number[]): number[] => {
    if (num === 0) return arr;
    arr.unshift(num % 256);
    return numToArray(Math.floor(num / 256), arr);
  };

  if (num < 0) throw new Error("Cannot convert negative number to buffer");
  if (Number.isNaN(num)) throw new Error("Cannot convert NaN to buffer");

  if (num === 0) return Buffer.from([0]);

  return Buffer.from(numToArray(num, []));
};

/**
 * Derive the address of the feature PDA
 * @param feature The feature to set.
 * @param network The network
 */
export const getFeatureAccountAddress = (
  feature: NetworkFeature,
  network: PublicKey
): PublicKey => {
  const featureName = mapEnumToFeatureName(feature.enum);

  return PublicKey.findProgramAddressSync(
    [network.toBytes(), Buffer.from(featureName, "utf8")],
    PROGRAM_ID
  )[0];
};
