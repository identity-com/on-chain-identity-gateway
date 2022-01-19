import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  SendOptions,
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

import { DataTransaction, send } from "../util/connection";

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
    seed?: Uint8Array,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<GatewayToken | null>> {
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
}
