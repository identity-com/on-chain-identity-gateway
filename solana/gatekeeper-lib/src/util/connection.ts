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
import retry from "async-retry";

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

const sendWithRetry = async (
  connection: Connection,
  transaction: Transaction,
  options: ConfirmOptions = {},
  retries: number,
  ...signers: Keypair[]
): Promise<TransactionSignature> => {
  let finalResult;
  try {
    finalResult = await retry(
      async () => {
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve("timeout"), getSolanaTimeout())
        );

        let result;
        try {
          const blockchainPromise = sendAndConfirmTransaction(
            connection,
            transaction,
            signers,
            {
              commitment: SOLANA_COMMITMENT,
              ...options,
            }
          );
          result = (await Promise.race([
            blockchainPromise,
            timeoutPromise,
          ])) as string;
        } catch (err) {
          // sendAndConfirmTransaction has thrown an error.
          // We catch it here and re-throw it outside, otherwise it will trigger a retry.
          return err;
        }

        if (result === "timeout") {
          // trigger a retry
          console.log(
            `Timeout during Solana sendAndConfirmTransaction. Retry ${retries} times.`
          );
          throw new Error("Solana timeout");
        }
        return result;
      },
      {
        retries: retries,
      }
    );
  } catch (err) {
    console.log(`Retries exhausted on Solana sendAndConfirmTransaction`);
    throw new Error("Retries exhausted");
  }
  if (typeof finalResult === "string") return finalResult;
  // If finalResult is not a string, it comes from sendAndConfirmTransaction throwing an error. Re-throw it to the caller.
  throw finalResult;
};

export const send = (
  connection: Connection,
  transaction: Transaction,
  retries: number,
  options: ConfirmOptions = {},
  ...signers: Keypair[]
): Promise<TransactionSignature> =>
  sendWithRetry(
    connection,
    transaction,
    {
      skipPreflight: false,
      commitment: SOLANA_COMMITMENT,
      ...options,
    },
    retries,
    ...signers
  );
