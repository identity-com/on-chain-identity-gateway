import { Cluster, clusterApiUrl, Connection } from "@solana/web3.js";

export type ExtendedCluster = Cluster | "localnet";

export const CLUSTER: ExtendedCluster = (process.env.CLUSTER ||
  "localnet") as ExtendedCluster;
export const VALIDATOR_URL =
  process.env.CLUSTER_URL ||
  (CLUSTER === "localnet" ? "http://localhost:8899" : clusterApiUrl(CLUSTER));

export const getConnection = async (): Promise<Connection> =>
  new Connection(VALIDATOR_URL, "confirmed");
