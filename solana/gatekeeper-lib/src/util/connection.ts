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

export class SendableTransaction implements TransactionHolder {
  constructor(
    readonly connection: Connection,
    readonly transaction: Transaction
  ) {}

  withData<T>(data: T | (() => T | Promise<T>)): SendableDataTransaction<T> {
    return new SendableDataTransaction<T>(this, data);
  }

  async send(
    options: SendOptions = {},
    ...signers: Signer[]
  ): Promise<SentTransaction> {
    return new SentTransaction(
      this.connection,
      await this.connection.sendTransaction(this.transaction, signers, {
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
    signatures: (Buffer | null)[];
  } {
    const message = this.transaction.compileMessage();
    const signatures: (Buffer | null)[] = [];
    for (let x = 0; x < message.header.numRequiredSignatures; x++) {
      const sig = this.transaction.signatures.find((sig) =>
        sig.publicKey.equals(message.accountKeys[x])
      );
      if (sig) {
        signatures.push(sig.signature);
      } else {
        signatures.push(null);
      }
    }
    return {
      message: message.serialize(),
      signatures,
    };
  }

  static fromSerialized(
    connection: Connection,
    message: Buffer,
    signatures: (Buffer | null)[]
  ): SendableTransaction {
    const deMessage = Message.from(message);
    const transaction = Transaction.populate(deMessage);
    transaction.signatures = signatures
      .concat(
        ...Array(
          Math.max(
            0,
            deMessage.header.numRequiredSignatures - signatures.length
          )
        ).fill(null)
      )
      .slice(0, deMessage.header.numRequiredSignatures)
      .map((sig, index) => ({
        publicKey: deMessage.accountKeys[index],
        signature: sig,
      }));
    return new SendableTransaction(connection, transaction);
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
  allPartialSigners: Signer[] = [];
  constructor(
    readonly sendableTransaction: SendableTransaction,
    readonly data: T | (() => T | Promise<T>)
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
      .send(options, ...this.allPartialSigners.concat(extraSigners))
      .then((t) => t.withData(this.data));
  }
  async addHashOrNonce(hashOrNonce: HashOrNonce): Promise<this> {
    await addHashOrNonce(this, hashOrNonce);
    return this;
  }
  partialSign(...signers: Signer[]): this {
    this.transaction.partialSign(...signers);
    // add every signer to the data transaction
    this.allPartialSigners.push(...signers);
    return this;
  }
  feePayer(feePayer: PublicKey): this {
    this.transaction.feePayer = feePayer;
    return this;
  }
}

export class SentTransaction {
  constructor(
    readonly connection: Connection,
    readonly signature: TransactionSignature
  ) {}

  withData<T>(data: T | (() => T | Promise<T>)): SentDataTransaction<T> {
    return new SentDataTransaction<T>(this, data);
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
    readonly data: T | (() => T | Promise<T>)
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
