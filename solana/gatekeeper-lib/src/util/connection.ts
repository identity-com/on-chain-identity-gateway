import {
  Cluster,
  clusterApiUrl,
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionError,
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
  clusterUrl: string = process.env.CLUSTER_URL ||
    getClusterUrl(process.env.CLUSTER as ExtendedCluster)
): Connection => new Connection(clusterUrl, SOLANA_COMMITMENT);

export const send = async (
  connection: Connection,
  transaction: Transaction,
  options: SendOptions = {},
  ...signers: Keypair[]
): Promise<SentTransaction> =>
  new SentTransaction(
    connection,
    await connection.sendTransaction(transaction, signers, {
      preflightCommitment: SOLANA_COMMITMENT,
      ...options,
    })
  );

export class SentTransaction {
  readonly connection: Connection;
  private readonly _signature: TransactionSignature;

  constructor(connection: Connection, signature: TransactionSignature) {
    this.connection = connection;
    this._signature = signature;
  }

  get signature(): TransactionSignature {
    return this._signature;
  }

  withData<T>(data: T | (() => T | Promise<T>)): DataTransaction<T> {
    return new DataTransaction<T>(this, data);
  }

  async confirm(
    commitment?: Commitment,
    errorCallback?: (error: TransactionError) => void
  ): Promise<void> {
    const result = await this.connection.confirmTransaction(
      this._signature,
      commitment ? commitment : SOLANA_COMMITMENT
    );
    if (result.value.err) {
      if (errorCallback) {
        errorCallback(result.value.err);
      } else {
        throw new Error(`Error confirming transaction: ${result.value.err}`);
      }
    }
  }
}

export type BuildGatewayTokenTransactionResult = {
  transaction: Transaction;
  gatewayTokenAddress: PublicKey;
  unsignedSerializedTx: string;
};

export class DataTransaction<T> {
  readonly sentTransaction: SentTransaction;
  readonly data: T | (() => T | Promise<T>);

  constructor(
    sentTransaction: SentTransaction,
    data: T | (() => T | Promise<T>)
  ) {
    this.sentTransaction = sentTransaction;
    this.data = data;
  }

  get signature(): TransactionSignature {
    return this.sentTransaction.signature;
  }

  async confirm(
    commitment?: Commitment,
    errorCallback?: (error: TransactionError) => void
  ): Promise<T | null> {
    await this.sentTransaction.confirm(commitment, errorCallback);
    return this.data instanceof Function ? await this.data() : this.data;
  }
}
