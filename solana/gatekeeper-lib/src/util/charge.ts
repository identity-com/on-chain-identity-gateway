import {Action, ChargeOption, ChargeOptions, TransactionOptions} from "./types";
import {PublicKey, SystemProgram, TransactionInstruction} from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";

/***
 * If the configuration mandates a charge for the given action, create the charge instruction
 * @param chargeOptions The charge configuration
 * @param transactionOptions The transaction configuration
 * @param action The action that is being performed
 * @param gatekeeperAuthority The gatekeeper
 * @returns The charge instruction, or undefined if no charge is required or possible
 */
export const generateChargeInstruction = async (
  chargeOptions: ChargeOptions,
  transactionOptions: TransactionOptions,
  action: Action,
  gatekeeperAuthority: PublicKey,
): Promise<TransactionInstruction | undefined> => {
  const chargeOption = chargeOptions[action];
  if (!chargeOption) return undefined;

  const chargePayer = getChargePayer(transactionOptions, chargeOption, gatekeeperAuthority);
  
  if (!chargePayer) return undefined;

  if (!chargeOption.splTokenMint) {
    // Payment is in SOL
    return SystemProgram.transfer({
      fromPubkey: chargePayer,
      toPubkey: chargeOption.recipient,
      lamports: chargeOption.amount,
    });
  }

  // Payment is in a token
  // Note - Only ATAs are supported at present
  const chargePayerATA = await getAssociatedTokenAddress(chargeOption.splTokenMint, chargePayer, true);
  const chargeRecipientATA = await getAssociatedTokenAddress(chargeOption.recipient, chargePayer, true);

  return createTransferInstruction(
    chargePayerATA,
    chargeRecipientATA,
    chargePayer,
    chargeOption.amount,
  )
}

export const getChargePayer = (
  transactionOptions: TransactionOptions,
  chargeOption: ChargeOption,
  gatekeeperAuthority: PublicKey,
): PublicKey | undefined  => {
  // we can only charge if the chargePayer is one of the cosigners
  switch (chargeOption.chargePayer) {
    case 'FEE_PAYER':
      if (!transactionOptions.feePayer?.equals(gatekeeperAuthority)) {
        return transactionOptions.feePayer;
      }
      
      break;
    case 'RENT_PAYER':
      if (!transactionOptions.rentPayer?.equals(gatekeeperAuthority)) {
        return transactionOptions.rentPayer;
      }
      
      break;
  }
  
  return undefined;
}