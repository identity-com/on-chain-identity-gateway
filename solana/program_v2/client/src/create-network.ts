import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { u8, NetworkData } from "./state";
import {getAnchorProgram} from "./lib/util";

export const createNetwork = async (
  programId: PublicKey,
  network: Keypair,
  funder: Keypair,
  networkData: NetworkData
) => {
  const program = getAnchorProgram(funder);
  console.log(program);

  // const create = SystemProgram.createAccount({
  //   fromPubkey: funder.publicKey,
  //   newAccountPubkey: network.publicKey,
  //   lamports: LAMPORTS_PER_SOL,
  //   space: 15_000,
  //   programId: programId,
  // });
  //
  // const [networkSigner, signerBump] = await PublicKey.findProgramAddress(
  //   [Buffer.from("network"), network.publicKey.toBuffer()],
  //   programId
  // );
  // networkData.signerBump = new u8(signerBump);
  // const data = Buffer.alloc(u8.staticSize() + networkData.size());
  // const offset = { offset: 0 };
  // new u8(0).write(data, offset);
  // networkData.write(data, offset);
  // let createNetwork = new TransactionInstruction({
  //   keys: [
  //     { pubkey: network.publicKey, isSigner: false, isWritable: true },
  //     { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  //     { pubkey: networkSigner, isSigner: false, isWritable: false },
  //   ],
  //   programId,
  //   data,
  // });
  //
  // return [create, createNetwork];
};
