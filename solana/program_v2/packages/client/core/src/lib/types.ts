import { PublicKey, Transaction } from '@solana/web3.js';
import { BN } from '@project-serum/anchor';
import { ConfirmOptions, Connection } from '@solana/web3.js';
import { CustomClusterUrlConfig, ExtendedCluster } from './connection';

export interface Wallet {
  signTransaction(tx: Transaction): Promise<Transaction>;
  signAllTransactions(txs: Transaction[]): Promise<Transaction[]>;
  publicKey: PublicKey;
}

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

export type UpdateAuthKeytructure = {
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
};

export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: UpdateFeeStructure;
  authKeys: UpdateAuthKeytructure;
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
  settlementInfo: SettlementInfo;
};

export type SettlementInfo = unknown;

export type CreateGatekeeperData = {
  tokenFees: FeeStructure[];
  authThreshold: number;
  authKeys: AuthKeyStructure[];
};

export type UpdateGatekeeperData = {
  // TODO: Maybe set these to be optional
  tokenFees: UpdateFeeStructure;
  authThreshold: number;
  authKeys: UpdateAuthKeytructure;
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
  clusterType: ExtendedCluster;
  customConfig?: CustomClusterUrlConfig;
};
