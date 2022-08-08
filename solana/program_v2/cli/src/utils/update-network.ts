import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { NetworkData } from "./state";
import * as anchor from "@project-serum/anchor";
import { IDL } from "./gateway-v2";
import { Wallet } from "@project-serum/anchor";

export const updateNetwork = async (
  programId: PublicKey,
  network: Keypair,
  payer: Keypair,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  networkData: NetworkData
): Promise<Transaction> => {
  const wallet = new Wallet(payer);
  const connection = new Connection("http://localhost:8899", "confirmed");
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program(IDL, programId, provider);

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
    .updateNetwork(updateNetworkParams as any)
    .accounts({
      network: network.publicKey,
    })
    .signers([])
    .transaction();

  return transaction;
};
