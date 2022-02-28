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
import { SOLANA_COMMITMENT } from "../util/constants";
import {
  getOrCreateBlockhashOrNonce,
  TransactionOptions,
} from "../util/transaction";
import { Commitment } from "@solana/web3.js";

/**
 * Global default configuration for the gatekeeper
 */
export type GatekeeperConfig = TransactionOptions & {
  defaultExpirySeconds?: number;
};

/**
 * Encapsulates actions performed by a gatekeeper
 */
export class GatekeeperService {
  /**
   * Construct a new GatekeeperService instance
   * @param connection A solana connection object
   * @param gatekeeperNetwork The network that the gatekeeper belongs to
   * @param gatekeeperAuthority The gatekeeper's key
   * @param config Global default configuration for the gatekeeper
   */
  constructor(
    private readonly connection: Connection,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private config: GatekeeperConfig = {}
  ) {}

  private async optionsWithDefaults(
    options: TransactionOptions = {}
  ): Promise<Required<TransactionOptions>> {
    const defaultOptions = {
      feePayer: this.gatekeeperAuthority.publicKey,
      rentPayer: this.gatekeeperAuthority.publicKey,
      commitment: SOLANA_COMMITMENT,
      ...this.config,
      ...options,
    };
    const blockhashOrNonce = await getOrCreateBlockhashOrNonce(
      this.connection,
      defaultOptions.blockhashOrNonce
    );

    return {
      ...defaultOptions,
      blockhashOrNonce,
    };
  }

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
    seed?: Uint8Array,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
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
        normalizedOptions.rentPayer,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
      )
    );

    const hashOrNonce =
      normalizedOptions.blockhashOrNonce ||
      (await this.connection.getRecentBlockhash());
    return new SendableTransaction(this.connection, transaction)
      .withData(() => getGatewayToken(this.connection, gatewayTokenAddress))
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(hashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperAuthority));
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   * @param options
   */
  issue(
    recipient: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
    return this.issueVanilla(recipient, undefined, options);
  }

  /**
   * Calls issue, sends and confirms
   * @param recipient
   * @param options
   * @returns
   */
  async sendIssue(
    recipient: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.issue(recipient, options)
      .then((result) => result.send())
      .then((result) => {
        return result.confirm();
      });
  }
  /**
   * Updates a GatewayToken by building a transaction with the given txBuilder function,
   * and returning the existing token with the given updated state value and (optional) expiryTime.
   * @param gatewayTokenKey
   * @param instruction
   * @param options
   */
  private async updateToken(
    gatewayTokenKey: PublicKey,
    instruction: TransactionInstruction,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const transaction = new Transaction().add(instruction);

    return new SendableTransaction(this.connection, transaction)
      .withData(() => this.getGatewayTokenOrError(gatewayTokenKey))
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperAuthority));
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   * @param options
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
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
      options
    );
  }

  /**
   * Sends and confirms revoke
   * @param gatewayTokenKey
   * @param options
   * @returns
   */
  async sendRevoke(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
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
      options
    )
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param options
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, options);
  }

  /**
   * Sends and confirms Freeze
   * @param gatewayTokenKey
   * @param options
   * @returns
   */
  async sendFreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, options)
      .then((results) => results.send())
      .then((results) => results.confirm());
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   * @param options
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, options);
  }

  /**
   * Sends and confirms unfreeze
   * @param gatewayTokenKey
   * @param options
   * @returns
   */
  async sendUnfreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, options)
      .then((results) => results.send())
      .then((results) => results.confirm());
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
   * @param options
   */
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress(),
      expireTime
    );
    return this.updateToken(gatewayTokenKey, instruction, options);
  }

  /**
   * Sends and confirms updateExpiry
   * @param gatewayTokenKey
   * @param expireTime
   * @param options
   * @returns
   */
  async sendUpdateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountAddress(),
      expireTime
    );
    return this.updateToken(gatewayTokenKey, instruction, options)
      .then((results) => results.send())
      .then((results) => results.confirm());
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
    options?: TransactionOptions
  ) {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const transactionSignedByGatekeeper =
      !!transaction.transaction.signatures.find((sig) =>
        sig.publicKey.equals(this.gatekeeperAuthority.publicKey)
      );
    const transactionSignedByPayer = !!transaction.transaction.signatures.find(
      (sig) => sig.publicKey.equals(normalizedOptions.rentPayer)
    );
    if (
      (transactionSignedByGatekeeper || transactionSignedByPayer) &&
      !transaction.transaction.verifySignatures()
    ) {
      throw Error("Transaction is not validly signed by gatekeeper");
    }

    await transaction.addHashOrNonce(normalizedOptions.blockhashOrNonce);
    if (transactionSignedByGatekeeper) {
      transaction.partialSign(this.gatekeeperAuthority);
    }
  }
}

export class SimpleGatekeeperService {
  gs: GatekeeperService;

  /**
   *
   * @param connection
   * @param gatekeeperNetwork
   * @param gatekeeperAuthority
   * @param config
   */
  constructor(
    connection: Connection,
    gatekeeperNetwork: PublicKey,
    gatekeeperAuthority: Keypair,
    config: GatekeeperConfig = {}
  ) {
    this.gs = new GatekeeperService(
      connection,
      gatekeeperNetwork,
      gatekeeperAuthority,
      config
    );
  }
  async issue(
    recipient: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .issue(recipient, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
  async revoke(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .revoke(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
  async freeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .freeze(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
  async unfreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .unfreeze(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .updateExpiry(gatewayTokenKey, expireTime, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }
}
