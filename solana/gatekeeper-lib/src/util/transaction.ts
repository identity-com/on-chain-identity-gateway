import { PROGRAM_ID } from "@identity.com/solana-gateway-ts";
import {
  Commitment,
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import R from "ramda";
import { HashOrNonce } from "./connection";

export const isGatewayTransaction = (transaction: Transaction): boolean => {
  return R.all(R.propEq("programId", PROGRAM_ID), transaction.instructions);
};

export type TransactionOptions = {
  feePayer?: PublicKey; // defaults to the gatekeeper
  rentPayer?: PublicKey; // defaults to the gatekeeper
  commitment?: Commitment; // defaults to SOLANA_COMMITMENT
  blockhashOrNonce?: HashOrNonce; // if not set, calls connection.getRecentBlockhash to get a new blockhash
};

export const getOrCreateBlockhashOrNonce = (
  connection: Connection,
  blockhashOrNonce: HashOrNonce | undefined
): Promise<HashOrNonce> => {
  if (blockhashOrNonce) return Promise.resolve(blockhashOrNonce);
  return (
    connection
      .getRecentBlockhash()
      // convert the result to the structure required for HashOrNonce
      .then(({ blockhash }) => ({ recentBlockhash: blockhash }))
  );
};
