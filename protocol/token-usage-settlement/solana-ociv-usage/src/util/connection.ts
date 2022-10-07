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

export type ExtendedCluster = Cluster | "localnet" | "civicnet";
export const CIVICNET_URL =
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";

export const getClusterUrl = (cluster: ExtendedCluster) => {
  switch (cluster) {
    case "localnet":
      return "http://localhost:8899";
    case "civicnet":
      return CIVICNET_URL;
    default:
      return clusterApiUrl(cluster);
  }
};

export const getConnection = (
  cluster: ExtendedCluster = "mainnet-beta",
  commitment = SOLANA_COMMITMENT
): Connection => {
  const clusterUrl = process.env.CLUSTER_URL
    ? process.env.CLUSTER_URL
    : getClusterUrl(cluster);

  console.log(`Returning Connection with clusterURL: ${clusterUrl}`);
  return new Connection(clusterUrl, commitment);
};

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
