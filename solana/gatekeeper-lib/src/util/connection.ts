import {
  Cluster,
  clusterApiUrl,
  ConfirmOptions,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import {
  SOLANA_COMMITMENT,
  SOLANA_TIMEOUT_PROCESSED,
  SOLANA_TIMEOUT_CONFIRMED,
  SOLANA_TIMEOUT_FINALIZED,
} from "./constants";

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
  clusterUrl: string = process.env.CLUSTER_URL ||
    getClusterUrl(process.env.CLUSTER as ExtendedCluster)
): Connection => new Connection(clusterUrl, SOLANA_COMMITMENT);

const getSolanaTimeout = (): number => {
  switch (SOLANA_COMMITMENT) {
    case "processed":
      return SOLANA_TIMEOUT_PROCESSED;
    case "confirmed":
      return SOLANA_TIMEOUT_CONFIRMED;
    case "finalized":
      return SOLANA_TIMEOUT_FINALIZED;
    default:
      return SOLANA_TIMEOUT_CONFIRMED;
  }
};

const sendWithTimeout = async (
  connection: Connection,
  transaction: Transaction,
  options: ConfirmOptions = {},
  ...signers: Keypair[]
): Promise<TransactionSignature> => {
  const timeoutPromise = new Promise<TransactionSignature>((_resolve, reject) =>
    setTimeout(
      () => reject(new Error("Solana call timed out")),
      getSolanaTimeout()
    )
  );

  const blockchainPromise = sendAndConfirmTransaction(
    connection,
    transaction,
    signers,
    {
      commitment: SOLANA_COMMITMENT,
      ...options,
    }
  );

  return Promise.race([blockchainPromise, timeoutPromise]);
};

export const send = (
  connection: Connection,
  transaction: Transaction,
  options: ConfirmOptions = {},
  ...signers: Keypair[]
): Promise<TransactionSignature> =>
  sendWithTimeout(
    connection,
    transaction,
    {
      skipPreflight: false,
      commitment: SOLANA_COMMITMENT,
      ...options,
    },
    ...signers
  );
