import { PublicKey, Transaction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

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
  add: [];
  remove: [];
};

export type AuthKeyStructure = {
  flags: number;
  key: PublicKey;
};

export type CreateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  networkDataLen: number;
  signerBump: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
};

export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  networkDataLen: number;
  fees: UpdateFeeStructure;
  authKeys: AuthKeyStructure[];
};
// TODO: passExpireTime shouldn't be an anchor.BN here? Also unsure why fees and authKeys aren't required here, as they are present in the IDL
export type NetworkAccount = {
  version: number;
  initialAuthority: PublicKey;
  authThreshold: number;
  passExpireTime: number;
  signerBump: number;
  // fees: FeeStructure[];
  // authKeys: AuthKeyStructure[];
};
