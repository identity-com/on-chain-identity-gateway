import {
  getPythProgramKeyForCluster,
  PythConnection,
} from "@pythnetwork/client";
import {
  Program,
  Provider,
  web3,
  setProvider,
  workspace,
} from "@project-serum/anchor";
import { clusterApiUrl, Connection, Transaction, TransactionInstruction } from "@solana/web3.js";
import { PythTest } from "../target/types/pyth_test";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const provider = Provider.local();
setProvider(provider);

const program = workspace.PythTest as Program<PythTest>;

(async () => {
  // const { blockhash: recentBlockhash }  = await connection.getRecentBlockhash();
  // const instruction = new TransactionInstruction({
  //   keys
  // });
  // const transaction = new Transaction({ recentBlockhash }).add(
  // instruction
)
})().catch(console.error);
  