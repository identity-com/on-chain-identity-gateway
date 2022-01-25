import {
  Cluster,
  clusterApiUrl,
  Commitment,
  Connection,
  Message,
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

export class SendableTransaction {
  readonly connection: Connection;
  private readonly _transaction: Transaction;

  constructor(connection: Connection, transaction: Transaction) {
    this.connection = connection;
    this._transaction = transaction;
  }

  async send(
    options?: SendOptions,
    ...additionalSigners: Signer[]
  ): Promise<SentTransaction> {
    const signature = await this.connection.sendTransaction(
      this._transaction,
      additionalSigners,
      {
        preflightCommitment: SOLANA_COMMITMENT,
        ...options,
      }
    );
    return new SentTransaction(this.connection, signature);
  }

  withData<T>(data: T | (() => T | Promise<T>)): SendableDataTransaction<T> {
    return new SendableDataTransaction<T>(this, data);
  }

  get transaction(): Transaction {
    return this._transaction;
  }

  addSignature(pubkey: PublicKey, signature: Buffer) {
    this._transaction.addSignature(pubkey, signature);
  }

  /**
   * The signatures should be sent to client separately from the actual
   * transaction because there are weird issues when sending together.
   * bs58 encoded
   */
  serializeForRelaying(): {
    transactionMessage: string;
    signatures: (string | null)[];
  } {
    const message = this._transaction.compileMessage();
    const signatures: (string | null)[] = [];
    for (let x = 0; x < message.header.numRequiredSignatures; x++) {
      type PresentSignature = {
        signature: Buffer;
        publicKey: PublicKey;
      };
      const signature: PresentSignature | undefined =
        this._transaction.signatures
          .filter((sig): sig is PresentSignature => !!sig.signature)
          .find(
            (sig) =>
              sig.signature && sig.publicKey.equals(message.accountKeys[x])
          );
      if (signature) {
        signatures.push(bs58.encode(signature.signature));
      } else {
        signatures.push(null);
      }
    }
    return {
      transactionMessage: bs58.encode(this._transaction.serializeMessage()),
      signatures,
    };
  }

  /**
   * @param connection The connection to use
   * @param transactionMessage bs58 encoded transaction message
   * @param signatures bs58 encoded signatures. Must be same size as message numRequiredSigners
   */
  static fromRelay(
    connection: Connection,
    transactionMessage: string,
    signatures: (string | null)[]
  ): SendableTransaction {
    // From web3.js
    const DEFAULT_SIGNATURE = bs58.encode(Buffer.alloc(64).fill(0));

    const message = Message.from(bs58.decode(transactionMessage));
    return new SendableTransaction(
      connection,
      Transaction.populate(
        message,
        signatures
          .map((sig) => (sig ? sig : DEFAULT_SIGNATURE))
          .concat(
            ...new Array(
              Math.max(
                0,
                message.header.numRequiredSignatures - signatures.length
              )
            ).fill(DEFAULT_SIGNATURE)
          )
          .slice(0, message.header.numRequiredSignatures)
      )
    );
  }
}

export class SendableDataTransaction<T> {
  private readonly _transaction: SendableTransaction;
  readonly data: T | (() => T | Promise<T>);

  constructor(
    transaction: SendableTransaction,
    data: T | (() => T | Promise<T>)
  ) {
    this._transaction = transaction;
    this.data = data;
  }

  async send(
    options?: SendOptions,
    ...additionalSigners: Signer[]
  ): Promise<SentDataTransaction<T>> {
    return new SentDataTransaction<T>(
      await this._transaction.send(options, ...additionalSigners),
      this.data
    );
  }

  get transaction(): Transaction {
    return this._transaction.transaction;
  }

  addSignature(pubkey: PublicKey, signature: Buffer) {
    this._transaction.addSignature(pubkey, signature);
  }

  /**
   * The signatures should be sent to client separately from the actual
   * transaction because there are weird issues when sending together
   */
  serializeForRelaying(): {
    transactionMessage: string;
    signatures: (string | null)[];
  } {
    return this._transaction.serializeForRelaying();
  }
}

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

  withData<T>(data: T | (() => T | Promise<T>)): SentDataTransaction<T> {
    return new SentDataTransaction<T>(this, data);
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

export class SentDataTransaction<T> {
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
  ): Promise<T> {
    await this.sentTransaction.confirm(commitment, errorCallback);
    return this.data instanceof Function ? await this.data() : this.data;
  }
}
