import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
  SendTransactionError,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  freeze,
  GatewayToken,
  issueVanilla,
  revoke,
  unfreeze,
  updateExpiry,
  getGatewayToken,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  getGatekeeperAccountAddress,
  findGatewayToken,
} from "@identity.com/solana-gateway-ts";

import {
  BuildGatewayTokenTransactionResult,
  DataTransaction,
  send,
} from "../util/connection";
import { isGatewayTransaction } from "../util/transaction";

/**
 * Global default configuration for the gatekeeper
 */
export type GatekeeperConfig = {
  defaultExpirySeconds?: number;
};

/**
 * Encapsulates actions performed by a gatekeeper
 */
export class GatekeeperService {
  /**
   * Construct a new GatekeeperService instance
   * @param connection A solana connection object
   * @param payer The payer for any transactions performed by the gatekeeper
   * @param gatekeeperNetwork The network that the gatekeeper belongs to
   * @param gatekeeperAuthority The gatekeeper's key
   * @param config Global default configuration for the gatekeeper
   */
  constructor(
    private readonly connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private config: GatekeeperConfig = {}
  ) {}

  private gatekeeperAccountAddress() {
    return getGatekeeperAccountAddress(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
  }

  private getDefaultExpireTime(): number | undefined {
    if (!this.config.defaultExpirySeconds) return undefined;
    const now = Math.floor(Date.now() / 1000);
    return now + this.config.defaultExpirySeconds;
  }

  private getGatewayTokenOrError(
    gatewayTokenAddress: PublicKey
  ): Promise<GatewayToken> {
    return getGatewayToken(this.connection, gatewayTokenAddress).then(
      (gatewayToken: GatewayToken | null) => {
        if (!gatewayToken)
          throw new Error(
            "Error retrieving gateway token at address " + gatewayToken
          );
        return gatewayToken;
      }
    );
  }

  /**
   * Given a transaction, add a 'dummy' recent blockhash, a feePayer
   * and serialize to a base64 string
   * @param {Transaction} transaction
   * @returns {Promise<string>}
   */
  private async signAndSerializeBuiltTransaction(
    transaction: Transaction
  ): Promise<string> {
    // recent blockhash and feepayer are required for signing and serialization
    transaction.recentBlockhash = (
      await this.connection.getRecentBlockhash()
    ).blockhash;
    transaction.feePayer = this.payer.publicKey;
    await transaction.sign(this.payer, this.gatekeeperAuthority);
    const serializedTx = await transaction.serialize().toString("base64");
    return serializedTx;
  }

  /**
   * Builds, signs and serializes a transaction with a token issuance instruction for sending later.
   * @param {PublicKey} owner
   * @param {Uint8Array} seed
   * @returns {Promise<BuildGatewayTokenTransactionResult>}
   */
  async buildIssueTransaction(
    owner: PublicKey,
    seed?: Uint8Array
  ): Promise<BuildGatewayTokenTransactionResult> {
    const gatewayTokenAddress: PublicKey =
      await getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        this.gatekeeperNetwork
      );
    const gatekeeperAccount: PublicKey = await getGatekeeperAccountAddress(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );

    const expireTime = this.getDefaultExpireTime();
    const transaction = new Transaction().add(
      issueVanilla(
        gatewayTokenAddress,
        this.payer.publicKey,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
      )
    );

    const serializedTx = await this.signAndSerializeBuiltTransaction(
      transaction
    );
    return {
      serializedTx,
      transaction,
      gatewayTokenAddress,
    };
  }

  private async issueVanilla(
    owner: PublicKey,
    seed?: Uint8Array,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken | null>> {
    const gatewayTokenAddress: PublicKey =
      await getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        this.gatekeeperNetwork
      );

    const { transaction } = await this.buildIssueTransaction(owner, seed);

    const sentTransaction = await send(
      this.connection,
      transaction,
      sendOptions,
      this.payer,
      this.gatekeeperAuthority
    );

    return sentTransaction.withData(() =>
      getGatewayToken(this.connection, gatewayTokenAddress)
    );
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   * @param confirmOptions
   */
  issue(
    recipient: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<DataTransaction<GatewayToken | null>> {
    return this.issueVanilla(recipient, undefined, confirmOptions);
  }

  /**
   * Updates a GatewayToken by building a transaction with the given txBuilder function,
   * and returning the existing token with the given updated state value and (optional) expiryTime.
   * @param gatewayTokenKey
   * @param instruction
   * @param sendOptions
   */
  private async updateToken(
    gatewayTokenKey: PublicKey,
    instruction: TransactionInstruction,
    sendOptions: SendOptions
  ): Promise<DataTransaction<GatewayToken>> {
    const transaction = new Transaction().add(instruction);

    const sentTransaction = await send(
      this.connection,
      transaction,
      sendOptions,
      this.payer,
      this.gatekeeperAuthority
    );

    return sentTransaction.withData(() =>
      this.getGatewayTokenOrError(gatewayTokenKey)
    );
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   * @param sendOptions
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken>> {
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    return this.updateToken(
      gatewayTokenKey,
      revoke(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      ),
      sendOptions
    );
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param sendOptions
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, sendOptions);
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param sendOptions
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, sendOptions);
  }

  /**
   * Returns a gateway token owned by this owner, if it exists
   * @param owner
   */
  async findGatewayTokenForOwner(
    owner: PublicKey
  ): Promise<GatewayToken | null> {
    return findGatewayToken(this.connection, owner, this.gatekeeperNetwork);
  }

  /**
   * Create a transaction with an update expiry instruction and return
   * a serialized form of the transaction
   * @param {PublicKey} gatewayTokenAddress
   * @param {number} expireTime
   * @returns {Promise<BuildGatewayTokenTransactionResult>}
   */
  async buildUpdateExpiryTransaction(
    gatewayTokenAddress: PublicKey,
    expireTime: number
  ): Promise<BuildGatewayTokenTransactionResult> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenAddress,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress(),
      expireTime
    );
    const transaction = new Transaction().add(instruction);
    const serializedTx = await this.signAndSerializeBuiltTransaction(
      transaction
    );
    return { serializedTx, transaction, gatewayTokenAddress };
  }
  /**
   * Update the expiry time of the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param expireTime
   * @param sendOptions
   */
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress(),
      expireTime
    );
    return this.updateToken(gatewayTokenKey, instruction, sendOptions);
  }

  // equivalent to GatekeeperNetworkService.hasGatekeeper, but requires no network private key
  async isRegistered(): Promise<boolean> {
    const gatekeeperAccount = await getGatekeeperAccountAddress(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return !!gatekeeperAccountInfo;
  }

  /**
   * Given a serialized, unsigned transaction:
   *  - hydrate the transaction
   *  - check that the transaction is a gateway transaction
   *  - set the recentBlockhash on the transaction if provided in sendOptions
   *  - send the transaction to the chain
   *  - get the updated associated gateway token
   * @param {string} serializedTx
   * @param {PublicKey} gatewayTokenKey
   * @param {SendOptions} sendOptions
   * @returns {Promise<DataTransaction<GatewayToken | null>>}
   */
  async sendSerializedTransaction(
    serializedTx: string,
    gatewayTokenKey: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken | null>> {
    const transaction = Transaction.from(Buffer.from(serializedTx, "base64"));
    // Guard against someone sending a non-gateway unserialized transaction
    if (!isGatewayTransaction(transaction)) {
      throw Error("transaction must be for the gateway program");
    }

    if (sendOptions.blockhash) {
      transaction.recentBlockhash = sendOptions.blockhash;
    }

    const sentTransaction = await send(
      this.connection,
      transaction,
      sendOptions,
      this.payer,
      this.gatekeeperAuthority
    );

    return sentTransaction.withData(() =>
      getGatewayToken(this.connection, gatewayTokenKey)
    );
  }
}
