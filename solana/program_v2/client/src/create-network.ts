import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { u8, NetworkData } from "./state";
import * as anchor from "@project-serum/anchor";
import { IDL } from "./gateway_v2";
import { AnchorProvider, Program } from "@project-serum/anchor";

export const createNetwork = async (
  programId: PublicKey,
  network: Keypair,
  funder: Keypair,
  networkData: NetworkData
): Promise<Transaction> => {
  const create = SystemProgram.createAccount({
    fromPubkey: funder.publicKey,
    newAccountPubkey: network.publicKey,
    lamports: LAMPORTS_PER_SOL,
    space: 15_000,
    programId: programId,
  });

  const [networkSigner, signerBump] = await PublicKey.findProgramAddress(
    [Buffer.from("network"), network.publicKey.toBuffer()],
    programId
  );
  const program = new anchor.Program(IDL, programId);

  const createNetworkParams = {
    authThreshold: networkData.authThreshold,
    passExpireTime: networkData.passExpireTime,
    networkDataLen: networkData.networkDataLen,
    signerBump: networkData.signerBump,
    fees: networkData.fees.map((data) => ({
      token: data.token,
      issue: data.issue,
      refresh: data.refresh,
      expire: data.expire,
      verify: data.verify,
    })),
    authKeys: [
      {
        flags: new anchor.BN(1),
        key: network.publicKey,
      },
    ],
  };

  const transaction = await program.methods
    .createNetwork(createNetworkParams)
    .accounts({
      network: network.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([network])
    .transaction();

  return transaction;
};
