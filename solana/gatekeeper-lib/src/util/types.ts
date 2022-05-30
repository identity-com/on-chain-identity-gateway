import {Commitment, PublicKey} from "@solana/web3.js";
import {HashOrNonce} from "./connection";

/**
 * Configuration for the charge the gatekeeper makes to the token receipient, if any.
 */
export type ChargeOption = {
  amount: number; // minor units eg lamports
  splTokenMint?: PublicKey; // if undefined, assume SOL
  chargePayer: 'FEE_PAYER' | 'RENT_PAYER';
  recipient: PublicKey;
}

/***
 * Configuration for the charge the gatekeeper may make to the token recipient, per action
 */
export type ChargeOptions = { [k in Action]?: ChargeOption };

export type TransactionOptions = {
  feePayer?: PublicKey; // defaults to the gatekeeper
  rentPayer?: PublicKey; // defaults to the gatekeeper
  commitment?: Commitment; // defaults to SOLANA_COMMITMENT
  blockhashOrNonce?: HashOrNonce; // if not set, calls connection.getRecentBlockhash to get a new blockhash
};

/**
 * Global default configuration for the gatekeeper
 */
export type GatekeeperConfig = TransactionOptions & {
  defaultExpirySeconds?: number;
  chargeOptions?: ChargeOptions;
};

export enum Action {
  ISSUE,
  REVOKE,
  REFRESH,
  FREEZE,
  UNFREEZE,
} 