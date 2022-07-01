import { Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import {} from "./state";

export const closeNetwork = async (
  programId: PublicKey,
  network: Keypair,
  receiver: Keypair,
  signer: Keypair
): Promise<TransactionInstruction> => {
  let closeNetwork = new TransactionInstruction({
    keys: [
      { pubkey: network.publicKey, isSigner: false, isWritable: true },
      { pubkey: receiver.publicKey, isSigner: false, isWritable: true },
      { pubkey: signer.publicKey, isSigner: true, isWritable: false },
    ],
    programId,
  });
  return closeNetwork;
};
