import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { u8, NetworkData } from "./state";

export const updateNetwork = async (
  programId: PublicKey,
  network: Keypair,
  payer: Keypair,
  networkData: NetworkData
): Promise<TransactionInstruction> => {
  const [networkSigner, signerBump] = await PublicKey.findProgramAddress(
    [Buffer.from("network"), network.publicKey.toBuffer()],
    programId
  );
  networkData.signerBump = new u8(signerBump);
  const data = Buffer.alloc(u8.staticSize() + networkData.size());
  const offset = { offset: 0 };
  new u8(0).write(data, offset);
  networkData.write(data, offset);
  let updateNetwork = new TransactionInstruction({
    keys: [
      { pubkey: network.publicKey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: networkSigner, isSigner: true, isWritable: false },
    ],
    programId,
    data,
  });
  return updateNetwork;
};
