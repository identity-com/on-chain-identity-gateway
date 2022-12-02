import {Connection, Keypair, PublicKey, Transaction, TransactionInstruction,} from "@solana/web3.js";
import {
  findGatewayToken,
  freeze,
  GatewayToken,
  getGatekeeperAccountAddress,
  getGatewayToken,
  getGatewayTokenAddressForOwnerAndGatekeeperNetwork,
  issueVanilla,
  revoke,
  unfreeze,
  updateExpiry,
} from "@identity.com/solana-gateway-ts";

import {Action, SendableDataTransaction, SendableTransaction} from "../util";
import {TransactionHolder} from "../util/connection";
import {SOLANA_COMMITMENT} from "../util/constants";
import {getOrCreateBlockhashOrNonce } from "../util/transaction";
import {GatekeeperConfig, TransactionOptions} from "../util/types";
import {generateChargeInstruction} from "../util/charge";

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
  // eslint-disable-next-line no-useless-constructor
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
            `Error retrieving gateway token at address ${
              gatewayToken ? gatewayToken : "null"
            } `
          );
        return gatewayToken;
      }
    );
  }
  
  private async getChargeInstruction(action: Action, transactionOptions: TransactionOptions): Promise<TransactionInstruction | undefined> {
    if (!this.config.chargeOptions) return undefined;
    return generateChargeInstruction(
      this.config.chargeOptions,
      transactionOptions,
      action,
      this.gatekeeperAuthority.publicKey,
    )
  }
  
  private async addChargeOption(action: Action, transactionOptions: TransactionOptions, transaction: Transaction): Promise<Transaction> {
    const chargeInstruction = await this.getChargeInstruction(action, transactionOptions);
    if (chargeInstruction) {
      transaction.add(chargeInstruction);
    }
    
    return transaction;
  }

  private async issueVanilla(
    owner: PublicKey,
    seed?: Uint8Array,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const gatewayTokenAddress: PublicKey =
      getGatewayTokenAddressForOwnerAndGatekeeperNetwork(
        owner,
        this.gatekeeperNetwork
      );
    const gatekeeperAccount: PublicKey = getGatekeeperAccountAddress(
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
    
    await this.addChargeOption(Action.ISSUE, normalizedOptions, transaction);
    
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
   * @param recipient PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken | null>>
   */
  issue(
    recipient: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken | null>> {
    return this.issueVanilla(recipient, undefined, options);
  }

  /**
   * Updates a GatewayToken by building a transaction with the given txBuilder function,
   * and returning the existing token with the given updated state value and (optional) expiryTime.
   * @param gatewayTokenKey PublicKey
   * @param instruction TransactionInstruction
   * @param action The action being performed
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken>>
   */
  private async updateToken(
    gatewayTokenKey: PublicKey,
    instruction: TransactionInstruction,
    action: Action,
    options?: TransactionOptions,
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const transaction = new Transaction().add(instruction);
    
    await this.addChargeOption(action, normalizedOptions, transaction);

    return new SendableTransaction(this.connection, transaction)
      .withData(() => this.getGatewayTokenOrError(gatewayTokenKey))
      .feePayer(normalizedOptions.feePayer)
      .addHashOrNonce(normalizedOptions.blockhashOrNonce)
      .then((t) => t.partialSign(this.gatekeeperAuthority));
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken>>
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const gatekeeperAccount = getGatekeeperAccountAddress(
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
      Action.REVOKE,
      options
    );
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken>>
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, Action.FREEZE, options);
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken>>
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperAccountAddress()
    );
    return this.updateToken(gatewayTokenKey, instruction, Action.UNFREEZE, options);
  }

  /**
   * Returns a gateway token owned by this owner, if it exists
   * @param owner PublicKey
   *
   * @returns Promise<GatewayToken | null>
   */
  async findGatewayTokenForOwner(
    owner: PublicKey
  ): Promise<GatewayToken | null> {
    return findGatewayToken(this.connection, owner, this.gatekeeperNetwork);
  }

  /**
   * Update the expiry time of the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey PublicKey
   * @param expireTime number
   * @param options TransactionOptions
   *
   * @returns Promise<SendableDataTransaction<GatewayToken>>
   */
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    options?: TransactionOptions
  ): Promise<SendableDataTransaction<GatewayToken>> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperAccountAddress(),
      expireTime
    );
    return this.updateToken(gatewayTokenKey, instruction, Action.REFRESH, options);
  }

  // equivalent to GatekeeperNetworkService.hasGatekeeper, but requires no network private key
  async isRegistered(): Promise<boolean> {
    const gatekeeperAccount = getGatekeeperAccountAddress(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return Boolean(gatekeeperAccountInfo);
  }

  async updateTransactionBlockhash(
    transaction: TransactionHolder,
    options?: TransactionOptions
  ): Promise<void> {
    const normalizedOptions = await this.optionsWithDefaults(options);
    const transactionSignedByGatekeeper = Boolean(
      transaction.transaction.signatures.some((sig) =>
        sig.publicKey.equals(this.gatekeeperAuthority.publicKey)
      )
    );
    const transactionSignedByPayer = Boolean(
      transaction.transaction.signatures.some((sig) =>
        sig.publicKey.equals(normalizedOptions.rentPayer)
      )
    );
    if (
      (transactionSignedByGatekeeper || transactionSignedByPayer) &&
      !transaction.transaction.verifySignatures()
    ) {
      throw new Error("Transaction is not validly signed by gatekeeper");
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
   * Simpler version of the GatekeeperService class. The functions in here send and confirm the results from those in GatekeeperService, returning a GatewayToken rather than a SendableDataTransaction
   * @param connection Connection
   * @param gatekeeperNetwork PublicKey
   * @param gatekeeperAuthority Keypair
   * @param config GatekeeperConfig
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

  /**
   * Sends and Confirms results from the GatekeeperService "issue" function
   * @param recipient PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<GatewayToken | null>
   */
  async issue(
    recipient: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .issue(recipient, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperService "revoke" function
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<GatewayToken | null>
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .revoke(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperService "freeze" function
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<GatewayToken | null>
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .freeze(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperService "unfreeze" function
   * @param gatewayTokenKey PublicKey
   * @param options TransactionOptions
   *
   * @returns Promise<GatewayToken | null>
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    options?: TransactionOptions
  ): Promise<GatewayToken | null> {
    return this.gs
      .unfreeze(gatewayTokenKey, options)
      .then((result) => result.send())
      .then((result) => result.confirm());
  }

  /**
   * Sends and Confirms results from the GatekeeperService "updateExpiry" function
   * @param gatewayTokenKey PublicKey
   * @param expireTime number
   * @param options TransactionOptions
   *
   * @returns Promise<GatewayToken | null>
   */
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
