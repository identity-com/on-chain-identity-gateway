import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "./constants";

export type ExtendedCluster = Cluster | "localnet";

export const CLUSTER: ExtendedCluster = (process.env.CLUSTER ||
  "localnet") as ExtendedCluster;
export const VALIDATOR_URL =
  process.env.CLUSTER_URL ||
  (CLUSTER === "localnet" ? "http://localhost:8899" : clusterApiUrl(CLUSTER));

export const getConnection = async (): Promise<Connection> =>
  new Connection(VALIDATOR_URL, SOLANA_COMMITMENT);

export const send = (
  connection: Connection,
  transaction: Transaction,
  ...signers: Keypair[]
): Promise<TransactionSignature> =>
  sendAndConfirmTransaction(connection, transaction, signers, {
    skipPreflight: false,
    commitment: SOLANA_COMMITMENT,
    preflightCommitment: "recent",
  });
