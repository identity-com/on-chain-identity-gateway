import {
  Blockhash,
  Cluster,
  clusterApiUrl,
  Commitment,
  Connection,
  NonceInformation,
  PublicKey,
  SendOptions,
  Signer,
  Transaction,
  TransactionError,
  TransactionSignature,
} from "@solana/web3.js";
import { SOLANA_COMMITMENT } from "./constants";

export type ExtendedCluster = Cluster | "localnet" | "civicnet";
export const CIVICNET_URL =
  "http://ec2-34-238-243-215.compute-1.amazonaws.com:8899";

export const getClusterUrl = (cluster: ExtendedCluster): string => {
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

export interface TransactionHolder {
  readonly connection: Connection;
  readonly transaction: Transaction;

  feePayer(feePayer: PublicKey): this;
  partialSign(...signers: Signer[]): this;
  addHashOrNonce(hashOrNonce: HashOrNonce): Promise<this>;
}

export type HashOrNonce =
  | {
      recentBlockhash: Blockhash;
    }
  | { nonce: NonceInformation }
  | "find";
export async function addHashOrNonce(
  transaction: TransactionHolder,
  hashOrNonce: HashOrNonce
): Promise<void> {
  if (hashOrNonce === "find") {
    transaction.transaction.recentBlockhash = await transaction.connection
      .getRecentBlockhash()
      .then((rbh) => rbh.blockhash);
  } else if ("recentBlockhash" in hashOrNonce) {
    transaction.transaction.recentBlockhash = hashOrNonce.recentBlockhash;
  } else {
    transaction.transaction.nonceInfo = hashOrNonce.nonce;
  }
}

export class SendableTransaction implements TransactionHolder {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly connection: Connection,
    readonly transaction: Transaction
  ) {}

  withData<T>(data: T | (() => T | Promise<T>)): SendableDataTransaction<T> {
    return new SendableDataTransaction<T>(this, normalizeDataCallback(data));
  }

  async send(
    options: SendOptions = {},
    ...extraSigners: Signer[]
  ): Promise<SentTransaction> {
    if (extraSigners.length > 0) {
      this.partialSign(...extraSigners);
    }

    const fullOptions = {
      preflightCommitment: SOLANA_COMMITMENT,
      ...options,
    };

    const txSig = await this.connection.sendRawTransaction(
      this.transaction.serialize(),
      fullOptions
    );

    return new SentTransaction(this.connection, txSig);
  }

  static fromSerialized(
    connection: Connection,
    message: Buffer
  ): SendableTransaction {
    return new SendableTransaction(connection, Transaction.from(message));
  }

  partialSign(...signers: Signer[]): this {
    this.transaction.partialSign(...signers);
    return this;
  }

  async addHashOrNonce(hashOrNonce: HashOrNonce): Promise<this> {
    await addHashOrNonce(this, hashOrNonce);
    return this;
  }

  feePayer(feePayer: PublicKey): this {
    this.transaction.feePayer = feePayer;
    return this;
  }
}

export class SendableDataTransaction<T> implements TransactionHolder {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly sendableTransaction: SendableTransaction,
    readonly data: DataCallback<T>
  ) {}

  get connection(): Connection {
    return this.sendableTransaction.connection;
  }

  get transaction(): Transaction {
    return this.sendableTransaction.transaction;
  }

  async send(
    options: SendOptions = {},
    ...extraSigners: Signer[]
  ): Promise<SentDataTransaction<T>> {
    return this.sendableTransaction
      .send(options, ...extraSigners)
      .then((t) => t.withData(this.data));
  }

  async addHashOrNonce(hashOrNonce: HashOrNonce): Promise<this> {
    await addHashOrNonce(this, hashOrNonce);
    return this;
  }

  partialSign(...signers: Signer[]): this {
    this.transaction.partialSign(...signers);
    return this;
  }

  feePayer(feePayer: PublicKey): this {
    this.transaction.feePayer = feePayer;
    return this;
  }
}

// The following functions are used to allow a SentTransaction to provide a callback
// that returns a datatype (e.g. a Gateway Token) related to the transaction.

// SentDataTransaction exposes this type from its data() function
type DataCallback<T> = () => Promise<T>;
// SentTransaction withData() accepts this more generic type
export type DataOrGeneralDataCallback<T> = T | (() => T | Promise<T>);

// checks if the input is a data callback or purely data.
const isGeneralDataCallback = <T>(
  data: DataOrGeneralDataCallback<T>
): data is () => T | Promise<T> => typeof data === "function";

// Convert the input callback into a standardised function that returns a promise of data
const normalizeDataCallback = <T>(
  d: DataOrGeneralDataCallback<T>
): DataCallback<T> => {
  if (isGeneralDataCallback(d)) {
    return () => Promise.resolve(d());
  }

  return () => Promise.resolve(d);
};

export class SentTransaction {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly connection: Connection,
    readonly signature: TransactionSignature
  ) {}

  withData<T>(data: DataOrGeneralDataCallback<T>): SentDataTransaction<T> {
    return new SentDataTransaction<T>(this, normalizeDataCallback(data));
  }

  async confirm(
    commitment?: Commitment,
    errorCallback?: (error: TransactionError) => void
  ): Promise<void> {
    const result = await this.connection.confirmTransaction(
      this.signature,
      commitment ? commitment : SOLANA_COMMITMENT
    );
    if (result.value.err) {
      if (errorCallback) {
        errorCallback(result.value.err);
      } else {
        throw new Error(
          `Error confirming transaction: ${result.value.err.toString()}`
        );
      }
    }
  }
}

export class SentDataTransaction<T> {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly sentTransaction: SentTransaction,
    readonly data: DataCallback<T>
  ) {}

  get signature(): TransactionSignature {
    return this.sentTransaction.signature;
  }

  async confirm(
    commitment?: Commitment,
    errorCallback?: (error: TransactionError) => void
  ): Promise<T | null> {
    await this.sentTransaction.confirm(commitment, errorCallback);
    return this.data instanceof Function ? this.data() : this.data;
  }
}
