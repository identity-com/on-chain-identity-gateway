import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { NetworkData } from "./state";
import * as anchor from "@project-serum/anchor";
import { IDL } from "./gateway-v2";
import { AnchorProvider, Wallet } from "@project-serum/anchor";

export const createNetwork = async (
  programId: PublicKey,
  network: Keypair,
  funder: Keypair,
  networkData: NetworkData
): Promise<Transaction> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        flags: BigInt(1),
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
