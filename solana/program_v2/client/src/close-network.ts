import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { IDL } from "./gateway_v2";

export const closeNetwork = async (
  programId: PublicKey,
  network: Keypair,
  receiver: Keypair,
  signer: Keypair
): Promise<Transaction> => {
  const program = new anchor.Program(IDL, programId);

  const transaction = await program.methods
    .closeNetwork()
    .accounts({
      network: network.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([])
    .transaction();
  return transaction;
};
