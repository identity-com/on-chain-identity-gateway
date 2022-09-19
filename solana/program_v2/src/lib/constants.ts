import { Commitment, PublicKey } from '@solana/web3.js';

export const GATEWAY_PROGRAM = new PublicKey(
  'FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe'
);

export const DEFAULT_NETWORK_SEED = 'gk-network';
export const DEFAULT_PASS_SEED = 'gk-pass';

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
