import {TransactionOptions} from "./transaction";
import {PublicKey} from "@solana/web3.js";

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