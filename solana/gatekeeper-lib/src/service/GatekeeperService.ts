import {
  Connection,
  Keypair,
  PublicKey,
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

import { SendableDataTransaction, SendableTransaction } from "../util";
import { HashOrNonce, TransactionHolder } from "../util/connection";

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

  private async issueVanilla(
    owner: PublicKey,
    feePayer: PublicKey,
    rentPayer: PublicKey,
    hashOrNonce: HashOrNonce,
    seed?: Uint8Array
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
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
        rentPayer,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
      )
    );

    let signers = [this.gatekeeperAuthority];
    if (
      this.payer.publicKey.equals(feePayer) ||
      this.payer.publicKey.equals(rentPayer)
    ) {
      signers.push(this.payer);
    }

    return new SendableTransaction(this.connection, transaction)
      .withData(() => getGatewayToken(this.connection, gatewayTokenAddress))
      .feePayer(feePayer)
      .addHashOrNonce(hashOrNonce)
      .then((t) => t.partialSign(...signers));
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   * @param options
   */
  issue(
    recipient: PublicKey,
    options: {
      hashOrNonce?: HashOrNonce;
      feePayer?: PublicKey;
      rentPayer?: PublicKey;
    } = {}
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
    return this.issueVanilla(
      recipient,
      options.feePayer ? options.feePayer : this.gatekeeperAuthority.publicKey,
      options.rentPayer ? options.rentPayer : this.payer.publicKey,
      options.hashOrNonce ? options.hashOrNonce : "find"
    );
  }

  /**
   * Updates a GatewayToken by building a transaction with the given txBuilder function,
   * and returning the existing token with the given updated state value and (optional) expiryTime.
   * @param gatewayTokenKey
   * @param instruction
   * @param hashOrNonce
   * @param feePayer Defaults to gatekeeperAuthority
   */
  private async updateToken(
    gatewayTokenKey: PublicKey,
    instruction: TransactionInstruction,
    hashOrNonce: HashOrNonce,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const transaction = new Transaction().add(instruction);

    return new SendableTransaction(this.connection, transaction)
      .withData(() => this.getGatewayTokenOrError(gatewayTokenKey))
      .feePayer(feePayer ? feePayer : this.gatekeeperAuthority.publicKey)
      .addHashOrNonce(hashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperAuthority));
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   * @param hashOrNonce
   * @param feePayer
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    hashOrNonce: HashOrNonce,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<GatewayToken>> {
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
      hashOrNonce,
      feePayer
    );
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param hashOrNonce
   * @param feePayer
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    hashOrNonce: HashOrNonce,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      hashOrNonce,
      feePayer
    );
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param hashOrNonce
   * @param feePayer
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    hashOrNonce: HashOrNonce,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      hashOrNonce,
      feePayer
    );
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
   * Update the expiry time of the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param expireTime
   * @param hashOrNonce
   * @param feePayer
   */
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    hashOrNonce: HashOrNonce,
    feePayer?: PublicKey
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress(),
      expireTime
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      hashOrNonce,
      feePayer
    );
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

  async updateTransactionBlockhash(
    transaction: TransactionHolder,
    hashOrNonce: HashOrNonce
  ) {
    const transactionSignedByGatekeeper =
      !!transaction.transaction.signatures.find((sig) =>
        sig.publicKey.equals(this.gatekeeperAuthority.publicKey)
      );
    const transactionSignedByPayer = !!transaction.transaction.signatures.find(
      (sig) => sig.publicKey.equals(this.payer.publicKey)
    );
    if (
      (transactionSignedByGatekeeper || transactionSignedByPayer) &&
      !transaction.transaction.verifySignatures()
    ) {
      throw Error("Transaction is not validly signed by gatekeeper");
    }

    await transaction.addHashOrNonce(hashOrNonce);
    if (transactionSignedByGatekeeper) {
      transaction.partialSign(this.gatekeeperAuthority);
    }
    if (transactionSignedByPayer) {
      transaction.partialSign(this.payer);
    }
  }
}
