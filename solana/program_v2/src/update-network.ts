// import {
//   Connection,
//   Keypair,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   TransactionInstruction,
// } from "@solana/web3.js";
// import { u8, NetworkData } from "./state";
// import * as anchor from "@project-serum/anchor";
// import { IDL } from "./gateway_v2";
// import { Wallet } from "@project-serum/anchor";

// export const updateNetwork = async (
//   programId: PublicKey,
//   network: Keypair,
//   payer: Keypair,
//   networkData: NetworkData
// ): Promise<Transaction> => {
//   const wallet = new Wallet(payer);
//   const connection = new Connection("http://localhost:8899", "confirmed");
//   const provider = new anchor.AnchorProvider(connection, wallet, {
//     commitment: "confirmed",
//   });
//   const program = new anchor.Program(IDL, programId, provider);

//   const updateNetworkParams = {
//     authThreshold: 1,
//     passExpireTime: new anchor.BN(360),
//     networkDataLen: 0,
//     fees: { add: [], remove: [] } as never,
//     authKeys: [] as never,
//   };

//   const transaction = await program.methods
//     .updateNetwork(updateNetworkParams)
//     .accounts({
//       network: network.publicKey,
//     })
//     .signers([])
//     .transaction();

//   return transaction;
// };
