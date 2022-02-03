import {
  Blockhash,
  Cluster,
  clusterApiUrl,
  Commitment,
  Connection,
  Message,
  NonceInformation,
  PublicKey,
  SendOptions,
  Signer,
  Transaction,
  TransactionError,
  TransactionSignature,
} from "@solana/web3.js";
import bs58 from "bs58";
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
) {
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

/**
 * from `@solana/web3.js`
 */
const DEFAULT_SIGNATURE = Buffer.alloc(64).fill(0);

export class SendableTransaction implements TransactionHolder {
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
    return new SentTransaction(
      this.connection,
      await this.connection.sendTransaction(this.transaction, extraSigners, {
        preflightCommitment: SOLANA_COMMITMENT,
        ...options,
      })
    );
  }

  /**
   * Message is separate from signatures due to the way rebuilding serialized transactions doesn't handle signatures
   */
  serializeForRelaying(): {
    message: Buffer;
    signatures: string[];
  } {
    const message = this.transaction.compileMessage();
    const signatures = message.accountKeys
      .slice(0, message.header.numRequiredSignatures)
      .map((key) => {
        const result = this.transaction.signatures.find((sig) =>
          sig.publicKey.equals(key)
        );
        if (result && result.signature) {
          return bs58.encode(result.signature);
        } else {
          return bs58.encode(DEFAULT_SIGNATURE);
        }
      });
    return {
      message: message.serialize(),
      signatures,
    };
  }

  static fromSerialized(
    connection: Connection,
    message: Buffer,
    signatures: string[]
  ): SendableTransaction {
    return new SendableTransaction(
      connection,
      Transaction.populate(Message.from(message), signatures)
    );
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
  } else {
    return () => Promise.resolve(d);
  }
};

export class SentTransaction {
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
        throw new Error(`Error confirming transaction: ${result.value.err}`);
      }
    }
  }
}

export class SentDataTransaction<T> {
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
    return this.data instanceof Function ? await this.data() : this.data;
  }
}
