import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  freeze,
  GatewayToken,
  getGatewayToken as solanaGetGatewayToken,
  getGatewayTokenKeyForOwner as solanaGetGatewayTokenKeyForOwner,
  issueVanilla,
  revoke,
  unfreeze,
  updateExpiry,
  findGatewayToken,
  getGatekeeperAccountKey as solanaGetGatekeeperAccountKey,
  State,
} from "@identity.com/solana-gateway-ts";

import { send } from "../util/connection";
import { PROGRAM_ID } from "../util/constants";

/**
 * Global default configuration for the gatekeeper
 */
export type GatekeeperConfig = {
  defaultExpirySeconds?: number;
};

export type GatewayTokenTxResult = {
  gatewayToken: GatewayToken;
  solanaTxId: string;
};

/**
 * Enables easier unit testing of gatekeeper-lib as we don't have to stub the imported function from gateway-ts,
 * we can stub this function which is in the same lib.
 */
export const getGatewayTokenKeyForOwner = async (
  owner: PublicKey,
  gatekeeperNetwork: PublicKey
): Promise<PublicKey> => {
  return solanaGetGatewayTokenKeyForOwner(owner, gatekeeperNetwork);
};

/**
 * Enables easier unit testing of gatekeeper-lib as we don't have to stub the imported function from gateway-ts,
 * we can stub this function which is in the same lib.
 */
export const getGatekeeperAccountKey = async (
  owner: PublicKey,
  gatekeeperNetwork: PublicKey
): Promise<PublicKey> => {
  return solanaGetGatekeeperAccountKey(owner, gatekeeperNetwork);
};

export const getGatewayToken = async (
  connection: Connection,
  gatewayTokenKey: PublicKey
): Promise<GatewayToken | null> => {
  return solanaGetGatewayToken(connection, gatewayTokenKey);
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
   * @param customRetryConfig RetryConfig including retry count and timeouts. All values have defaults.
   */
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAuthority: Keypair,
    private config: GatekeeperConfig = {}
  ) {}

  private gatekeeperAccountKey() {
    return getGatekeeperAccountKey(
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
    gatewayTokenKey: PublicKey
  ): Promise<GatewayToken> {
    return getGatewayToken(this.connection, gatewayTokenKey).then(
      (gatewayToken: GatewayToken | null) => {
        if (!gatewayToken)
          throw new Error(
            "Error retrieving gateway token at address " + gatewayTokenKey
          );
        return gatewayToken;
      }
    );
  }

  private async issueVanilla(
    owner: PublicKey,
    seed?: Uint8Array,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    const gatewayTokenKey: PublicKey = await getGatewayTokenKeyForOwner(
      owner,
      this.gatekeeperNetwork
    );
    const gatekeeperAccount = await this.gatekeeperAccountKey();

    const expireTime = this.getDefaultExpireTime();

    const transaction = new Transaction().add(
      issueVanilla(
        gatewayTokenKey,
        this.payer.publicKey,
        gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork,
        seed,
        expireTime
      )
    );

    const solanaTxId = await send(
      this.connection,
      transaction,
      confirmOptions,
      this.payer,
      this.gatekeeperAuthority
    );

    const gatewayToken = new GatewayToken(
      gatekeeperAccount,
      this.gatekeeperNetwork,
      owner,
      State.ACTIVE,
      gatewayTokenKey,
      PROGRAM_ID,
      expireTime
    );

    return { gatewayToken, solanaTxId };
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   */
  issue(
    recipient: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    return this.issueVanilla(recipient, undefined, confirmOptions);
  }

  /**
   * Updates a GatewayToken by building a transaction with the given txBuilder function,
   * and returning the existing token with the given updated state value and (optional) expiryTime.
   * @param gatewayTokenKey
   * @param txBuilder
   * @param updatedFields
   * @param confirmOptions
   */
  private async updateToken(
    gatewayTokenKey: PublicKey,
    instruction: TransactionInstruction,
    updatedFields: { state: State; expiryTime?: number | undefined },
    confirmOptions: ConfirmOptions
  ) {
    const existingToken = await this.getGatewayTokenOrError(gatewayTokenKey);
    const transaction = new Transaction().add(instruction);

    console.log("calling send");
    const solanaTxId = await send(
      this.connection,
      transaction,
      confirmOptions,
      this.payer,
      this.gatekeeperAuthority
    );

    return { gatewayToken: existingToken.update(updatedFields), solanaTxId };
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    const instruction: TransactionInstruction = revoke(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountKey()
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      { state: State.REVOKED },
      confirmOptions
    );
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    const instruction: TransactionInstruction = freeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountKey()
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      { state: State.FROZEN },
      confirmOptions
    );
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    const instruction: TransactionInstruction = unfreeze(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountKey()
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      { state: State.ACTIVE },
      confirmOptions
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
   */
  async updateExpiry(
    gatewayTokenKey: PublicKey,
    expireTime: number,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayTokenTxResult> {
    const instruction: TransactionInstruction = updateExpiry(
      gatewayTokenKey,
      this.gatekeeperAuthority.publicKey,
      await this.gatekeeperAccountKey(),
      expireTime
    );
    return this.updateToken(
      gatewayTokenKey,
      instruction,
      {
        state: State.ACTIVE,
        expiryTime: expireTime,
      },
      confirmOptions
    );
  }

  /**
   * Allows the caller to confirm a previously sent transaction to the given Commitment level.
   * Useful for implementing timeout / retry logic.
   * @param transactionId
   * @param confirmOptions
   * @returns
   */
  async confirmTransaction(
    transactionId: string,
    confirmOptions: ConfirmOptions
  ) {
    return this.connection.confirmTransaction(
      transactionId,
      confirmOptions.commitment
    );
  }

  // equivalent to GatekeeperNetworkService.hasGatekeeper, but requires no network private key
  async isRegistered(): Promise<boolean> {
    const gatekeeperAccount = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return !!gatekeeperAccountInfo;
  }
}
