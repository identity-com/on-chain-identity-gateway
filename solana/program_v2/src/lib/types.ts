import { PublicKey, Transaction } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import {BN} from "@project-serum/anchor";

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
  signerBump: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
};

export type UpdateNetworkData = {
  authThreshold: number;
  passExpireTime: number;
  fees: UpdateFeeStructure;
  authKeys: UpdateAuthKeytructure;
};
export type NetworkAccount = {
  version: number;
  initialAuthority: PublicKey;
  authThreshold: number;
  passExpireTime: number;
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
};

export type CreateGatekeeperData = {
  authThreshold: number;
  signerBump: number;
  authKeys: AuthKeyStructure[];
  gatekeeperNetwork: PublicKey;
  addresses: PublicKey;
  stakingAccount: PublicKey;
  fees: FeeStructure[];
};

export type UpdateGatekeeperData = {
  authThreshold: number;
  authKeys: UpdateAuthKeytructure;
  gatekeeperNetwork: PublicKey;
  addresses: PublicKey | null;
  stakingAccount: PublicKey | null;
  fees: UpdateFeeStructure;
};

export type GatekeeperAccount = {
  fees: FeeStructure[];
  authKeys: AuthKeyStructure[];
  gatekeeperNetwork: PublicKey;
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
    active?: {},
    revoked?: {},
    frozen?: {},
  };
}