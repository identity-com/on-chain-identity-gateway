import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
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
  proxyConnectionWithRetry,
  RetryConfig,
  defaultRetryConfig,
  DeepPartial,
} from "@identity.com/solana-gateway-ts";

import { send } from "../util/connection";
import { PROGRAM_ID } from "../util/constants";

/**
 * Global default configuration for the gatekeeper
 */
export type GatekeeperConfig = {
  defaultExpirySeconds?: number;
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
    private config: GatekeeperConfig = {},
    customRetryConfig: DeepPartial<RetryConfig> = defaultRetryConfig
  ) {
    this.connection = proxyConnectionWithRetry(connection, {
      ...defaultRetryConfig,
      ...customRetryConfig,
    });
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
  ): Promise<GatewayToken> {
    const gatewayTokenKey: PublicKey = await getGatewayTokenKeyForOwner(
      owner,
      this.gatekeeperNetwork
    );
    const gatekeeperAccount: PublicKey = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );

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

    try {
      await send(
        this.connection,
        transaction,
        confirmOptions,
        this.payer,
        this.gatekeeperAuthority
      );
    } catch (err) {
      // The tx may have succeeded but the blockchain call timed out. Check on-chain.
      const onChainToken: GatewayToken | null = await getGatewayToken(
        this.connection,
        gatewayTokenKey
      );
      if (onChainToken && onChainToken.state === State.ACTIVE) {
        console.log(
          "Send failed during Issue, but Active token is found on-chain. Returning success."
        );
      } else {
        // Token hasn't been issued on-chain.
        throw err;
      }
    }

    return new GatewayToken(
      gatekeeperAccount,
      this.gatekeeperNetwork,
      owner,
      State.ACTIVE,
      gatewayTokenKey,
      PROGRAM_ID,
      expireTime
    );
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   */
  issue(
    recipient: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayToken> {
    return this.issueVanilla(recipient, undefined, confirmOptions);
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   */
  async revoke(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayToken> {
    const existingToken = await this.getGatewayTokenOrError(gatewayTokenKey);
    const gatekeeperAccount = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    const transaction = new Transaction().add(
      revoke(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    try {
      await send(
        this.connection,
        transaction,
        confirmOptions,
        this.payer,
        this.gatekeeperAuthority
      );
    } catch (err) {
      // The tx may have succeeded but the blockchain call timed out. Check on-chain.
      const onChainToken: GatewayToken | null = await getGatewayToken(
        this.connection,
        gatewayTokenKey
      );
      if (onChainToken?.state === State.REVOKED) {
        console.log(
          "Send failed during Revoke, but token is already revoked on-chain. Returning success."
        );
      } else {
        // State hasn't been updated on-chain.
        throw err;
      }
    }

    return existingToken.update({ state: State.REVOKED });
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async freeze(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayToken> {
    const existingToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    const gatekeeperAccount = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );

    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      freeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    try {
      await send(
        this.connection,
        transaction,
        confirmOptions,
        this.payer,
        this.gatekeeperAuthority
      );
    } catch (err) {
      // The tx may have succeeded but the blockchain call timed out. Check on-chain.
      const onChainToken: GatewayToken | null = await getGatewayToken(
        this.connection,
        gatewayTokenKey
      );
      if (onChainToken?.state === State.FROZEN) {
        console.log(
          "Send failed during Freeze, but token is already frozen on-chain. Returning success."
        );
      } else {
        // State hasn't been updated on-chain.
        throw err;
      }
    }
    return existingToken.update({ state: State.FROZEN });
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async unfreeze(
    gatewayTokenKey: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<GatewayToken> {
    const existingToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    const gatekeeperAccount = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    console.log("gatekeeperAccount", gatekeeperAccount.toBase58());
    const transaction = new Transaction().add(
      unfreeze(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount
      )
    );

    try {
      await send(
        this.connection,
        transaction,
        confirmOptions,
        this.payer,
        this.gatekeeperAuthority
      );
    } catch (err) {
      // The tx may have succeeded but the blockchain call timed out. Check on-chain.
      const onChainToken: GatewayToken | null = await getGatewayToken(
        this.connection,
        gatewayTokenKey
      );
      if (onChainToken?.state === State.ACTIVE) {
        console.log(
          "Send failed during Unfreeze, but token is already Active on-chain. Returning success."
        );
      } else {
        // State hasn't been updated on-chain.
        throw err;
      }
    }

    return existingToken.update({ state: State.ACTIVE });
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
  ): Promise<GatewayToken> {
    const existingToken = await this.getGatewayTokenOrError(gatewayTokenKey);

    const gatekeeperAccount = await getGatekeeperAccountKey(
      this.gatekeeperAuthority.publicKey,
      this.gatekeeperNetwork
    );
    const transaction = new Transaction().add(
      updateExpiry(
        gatewayTokenKey,
        this.gatekeeperAuthority.publicKey,
        gatekeeperAccount,
        expireTime
      )
    );

    try {
      await send(
        this.connection,
        transaction,
        confirmOptions,
        this.payer,
        this.gatekeeperAuthority
      );
    } catch (err) {
      // The tx may have succeeded but the blockchain call timed out. Check on-chain.
      const onChainToken: GatewayToken | null = await getGatewayToken(
        this.connection,
        gatewayTokenKey
      );
      if (
        onChainToken?.expiryTime === expireTime &&
        onChainToken?.state === State.ACTIVE
      ) {
        console.log(
          "Send failed during updateExpiry, but time is already updated on-chain. Returning success."
        );
      } else {
        // State hasn't been updated on-chain.
        throw err;
      }
    }

    return existingToken.update({
      state: State.ACTIVE,
      expiryTime: expireTime,
    });
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
