import { PublicKey, Transaction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

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
  networkIndex: number;
  supportedTokens: SupportedToken[];
  gatekeepers: PublicKey[];
};

export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: UpdateFeeStructure;
  authKeys: UpdateAuthKeytructure;
  networkFeatures: number;
  supportedTokens: UpdateSupportedTokens;
  gatekeepers: UpdateGatekeepers;
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

export type SettlementInfo = {};
