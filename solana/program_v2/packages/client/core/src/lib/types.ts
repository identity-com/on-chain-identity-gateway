import { ConfirmOptions, Connection, PublicKey } from '@solana/web3.js';
import { BN, Wallet } from '@coral-xyz/anchor';
import { CustomClusterUrlConfig, ExtendedCluster } from './connection';

export type FeeStructure = {
  token: PublicKey;
  issue: number;
  refresh: number;
  expire: number;
  verify: number;
};

export type UpdateFeeStructure = {
  add: FeeStructure[];
  remove: PublicKey[];
};

export type UpdateAuthKeyStructure = {
  add: AuthKeyStructure[];
  remove: PublicKey[];
};

export type AuthKeyStructure = {
  flags: number;
  key: PublicKey;
};

export type CreateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
  supportedTokens: SupportedToken[];
  networkFeatures: number;
};

export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: UpdateFeeStructure;
  authKeys: UpdateAuthKeyStructure;
  networkFeatures: number;
  supportedTokens: UpdateSupportedTokens;
};

export type UpdateSupportedTokens = {
  add: SupportedToken[];
  remove: PublicKey[];
};

export type UpdateGatekeepers = {
  add: PublicKey[];
  remove: PublicKey[];
};

export type NetworkAccount = {
  version: number;
  authority: PublicKey;
  networkIndex: number;
  authThreshold: number;
  passExpireTime: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
  networkFeatures: number;
  // Hash Set
  supportedTokens: SupportedToken[];
  // Hash Set
  gatekeepers: PublicKey[];
};

export type SupportedToken = {
  key: PublicKey;
};

export type CreateGatekeeperData = {
  tokenFees: FeeStructure[];
  authThreshold: number;
  authKeys: AuthKeyStructure[];
  supportedTokens: SupportedToken[];
};

export type UpdateGatekeeperData = {
  // TODO: Maybe set these to be optional
  tokenFees: UpdateFeeStructure;
  authThreshold: number;
  authKeys: UpdateAuthKeyStructure;
};

export type GatekeeperFees = {
  /// The token for these fees. None value for this means native SOL price
  token: PublicKey;
  /// Fees taken at issuance of a new pass in token units or lamports for SOL.
  issue: string;
  /// Fees taken when a pass is refreshed in token units or lamports for SOL.
  refresh: string;
  /// The fee taken when a pass is expired in token units or lamports for SOL.
  /// This should only be used where pass value comes from one-time use.
  expire: string;
  /// The fee taken when a pass is verified in token units or lamports for SOL.
  /// This should only be used where pass value comes from proper use
  verify: string;
};

export type GatekeeperAccount = {
  version: number;
  authority: PublicKey;
  gatekeeperNetwork: PublicKey;
  stakingAccount: PublicKey;
  tokenFees: FeeStructure[];
  authKeys: AuthKeyStructure[];
  state: GatekeeperState;
};

export enum GatekeeperState {
  Active,
  Frozen,
  Halted,
}

export const GatekeeperStateMapping = {
  active: GatekeeperState.Active,
  frozen: GatekeeperState.Frozen,
  halted: GatekeeperState.Halted,
};

export type RawPassAccount = {
  version: number;
  issueTime: BN;
  subject: PublicKey;
  signerBump: number;
  network: PublicKey;
  gatekeeper: PublicKey;
  state: {
    active?: unknown;
    revoked?: unknown;
    frozen?: unknown;
  };
  networkData: number[];
  gatekeeperData: number[];
};

export type GatewayServiceOptions = {
  connection?: Connection;
  wallet?: Wallet;
  confirmOptions?: ConfirmOptions;
  clusterType?: ExtendedCluster;
  customConfig?: CustomClusterUrlConfig;
};
