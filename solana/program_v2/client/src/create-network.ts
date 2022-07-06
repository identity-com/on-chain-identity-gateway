import {
  Connection,
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
import { AnchorProvider, Program, Wallet } from "@project-serum/anchor";

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
  const wallet = new Wallet(funder);
  const connection = new Connection("http://localhost:8899", "confirmed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program(IDL, programId, provider);

  const createNetworkParams = {
    authThreshold: new anchor.BN(
      networkData.authThreshold as unknown as number
    ),
    passExpireTime: new anchor.BN(
      networkData.passExpireTime as unknown as number
    ),
    networkDataLen: new anchor.BN(
      networkData.networkDataLen as unknown as number
    ),
    signerBump: new anchor.BN(networkData.signerBump as unknown as number),
    fees: networkData.fees.map((data) => ({
      token: data.token,
      issue: new anchor.BN(data.issue as unknown as number),
      refresh: new anchor.BN(data.refresh as unknown as number),
      expire: new anchor.BN(data.expire as unknown as number),
      verify: new anchor.BN(data.verify as unknown as number),
    })),
    authKeys: [
      {
        flags: new anchor.BN(1),
        key: network.publicKey,
      },
    ],
  };

  const transaction = await program.methods
    .createNetwork(createNetworkParams as any)
    .accounts({
      network: network.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([network])
    .transaction();

  return transaction;
};
