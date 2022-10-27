import { Commitment, PublicKey } from '@solana/web3.js';

export const GATEWAY_PROGRAM = new PublicKey(
  'gate2TBGydKNyMNUqz64s8bz4uaWS9PNreMbmAjb1Ft'
);

export const NETWORK_SEED = 'gw-network';
export const GATEKEEPER_SEED = 'gw-gatekeeper';
export const DEFAULT_PASS_SEED = 'gw-pass';

export const SOLANA_MAINNET = 'mainnet-beta';

export const SOLANA_COMMITMENT: Commitment = 'confirmed';

export const NetworkKeyFlags = {
  // Key can change keys
  AUTH: 1 << 0,
  // Key can set [`GatekeeperNetwork::network_features`] (User expiry, did issuance, etc.)
  SET_FEATURES: 1 << 1,
  // Key can create new gatekeepers
  CREATE_GATEKEEPER: 1 << 2,
  // Key can freeze gatekeepers
  FREEZE_GATEKEEPER: 1 << 3,
  // Key can unfreeze gatekeepers
  UNFREEZE_GATEKEEPER: 1 << 4,
  // Key can halt gatekeepers
  HALT_GATEKEEPER: 1 << 5,
  // Key can un-halt gatekeepers
  UNHALT_GATEKEEPER: 1 << 6,
  // Key can un-revoke passes with gatekeepers
  UNREVOKE_PASS: 1 << 7,
  // Key can adjust fees in [`GatekeeperNetwork::fees`]
  ADJUST_FEES: 1 << 8,
  // Key can add new fee types to [`GatekeeperNetwork::fees`]
  ADD_FEES: 1 << 9,
  // Key can remove fee types from [`GatekeeperNetwork::fees`]
  REMOVE_FEES: 1 << 10,
  // Key can access the network's vault
  ACCESS_VAULT: 1 << 11,
  // Key can set [`GatekeeperNetwork::pass_expire_time`]
  SET_EXPIRE_TIME: 1 << 12,
};

export const GatekeeperKeyFlags = {
  /// Key can change keys
  AUTH: 1 << 0,
  /// Key can issue passes
  ISSUE: 1 << 1,
  /// Key can refresh passes
  REFRESH: 1 << 2,
  /// Key can freeze passes
  FREEZE: 1 << 3,
  /// Key can unfreeze passes
  UNFREEZE: 1 << 4,
  /// Key can revoke passes
  REVOKE: 1 << 5,
  /// Key can adjust gatekeeper fees
  ADJUST_FEES: 1 << 6,
  /// Key can set gatekeeper addresses key
  SET_ADDRESSES: 1 << 7,
  /// Key can set data on passes
  SET_PASS_DATA: 1 << 8,
  /// Key can add new fee types to a gatekeeper
  ADD_FEES: 1 << 9,
  /// Key can remove fee types from a gatekeeper
  REMOVE_FEES: 1 << 10,
  /// Key can access the gatekeeper's vault
  ACCESS_VAULT: 1 << 11,
  /// Key can unrevoke a pass with network concurrence.
  UNREVOKE_PASS: 1 << 12,
  /// Key can set gatekeeper state
  SET_GATEKEEPER_STATE: 1 << 13,
  /// Key can change gatekeepers for passes
  CHANGE_PASS_GATEKEEPER: 1 << 14,
  /// Key can expire a for passes
  EXPIRE_PASS: 1 << 15,
};
