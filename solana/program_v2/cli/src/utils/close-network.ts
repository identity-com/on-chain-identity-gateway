import * as anchor from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { IDL } from "./gateway-v2";

export const closeNetwork = async (
  programId: PublicKey,
  network: Keypair,
  receiver: Keypair,
  signer: Keypair
): Promise<Transaction> => {
  const wallet = new Wallet(receiver);
  const connection = new Connection("http://localhost:8899", "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program(IDL, programId, provider);
  console.log(signer);
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
