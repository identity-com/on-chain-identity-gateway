import { PROGRAM_ID } from "@identity.com/solana-gateway-ts";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import R from "ramda";

export const isGatewayTransaction = (transaction: Transaction): boolean => {
  return R.all(R.propEq("programId", PROGRAM_ID), transaction.instructions);
};
