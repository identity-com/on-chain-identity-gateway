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

export const updateNetwork = async (
  programId: PublicKey,
  network: Keypair,
  payer: Keypair,
  networkData: NetworkData
): Promise<Transaction> => {
  const program = new anchor.Program(IDL, programId);

  const updateNetworkParams = {
    authKeys: {
      add: [
        {
          flags: new anchor.BN(1),
          key: network.publicKey,
        },
      ],
      remove: [],
    },
    passExpireTime: null,
    fees: { add: [], remove: [] },
  };

  const transaction = await program.methods
    .updateNetwork(updateNetworkParams)
    .accounts({
      network: network.publicKey,
    })
    .signers([])
    .transaction();

  return transaction;
};
