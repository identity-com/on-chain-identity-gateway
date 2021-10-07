// import { Connection, Keypair, PublicKey, Transaction } from "@casper/web3.js";
// import {
//   freeze,
//   GatewayToken,
//   getGatewayToken,
//   getGatewayTokenKeyForOwner,
//   issueVanilla,
//   revoke,
//   unfreeze,
//   updateExpiry,
//   findGatewayToken,
//   getGatekeeperAccountKey,
// } from "@identity.com/solana-gateway-ts";
import {
  CasperClient,
  CLPublicKey,
  CLAccountHash,
  CLByteArray,
  CLKey,
  CLString,
  CLTypeBuilder,
  CLValue,
  CLValueBuilder,
  CLValueParsers,
  CLMap,
  DeployUtil,
  EventName,
  EventStream,
  Keys,
  RuntimeArgs,
} from "casper-js-sdk";

import { send } from "../util/connection";

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
   * @param kycTokenClient Casper KYC Token Client
   // * @param payer The payer for any transactions performed by the gatekeeper
   * @param gatekeeperNetwork The network that the gatekeeper belongs to
   * @param gatekeeperAuthority The gatekeeper's key
   * @param config Global default configuration for the gatekeeper
   */
  constructor(
    private kycTokenClient: KycTokenClient,
    // TODO: confirm who this is?
    // private payer: Keypair,
    private gatekeeperNetwork: CLPublicKey,
    private gatekeeperAuthority: Keys.AsymmetricKey,
    private config: GatekeeperConfig = {}
  ) {}

  private getDefaultExpireTime(): number | undefined {
    if (!this.config.defaultExpirySeconds) return undefined;
    const now = Math.floor(Date.now() / 1000);
    return now + this.config.defaultExpirySeconds;
  }

  private getGatewayTokenOrError(
    deployResult: DeployUtil.Deploy
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
    owner: CLPublicKey,
    seed?: Uint8Array
  ): Promise<GatewayToken> {

    const metaData = new Map<string, string>();

    const deploy = await this.kycTokenClient.issue(
        this.masterKey,
        owner,
        null,
        metaData,
        MIN_PAYMENT_AMOUNT
    );

    //
    // const gatewayTokenKey = await getGatewayTokenKeyForOwner(
    //   owner,
    //   this.gatekeeperNetwork
    // );
    // const gatekeeperAccount = await getGatekeeperAccountKey(
    //   this.gatekeeperAuthority.publicKey,
    //   this.gatekeeperNetwork
    // );
    //
    // const expireTime = this.getDefaultExpireTime();
    //
    // const transaction = new Transaction().add(
    //   issueVanilla(
    //     gatewayTokenKey,
    //     this.payer.publicKey,
    //     gatekeeperAccount,
    //     owner,
    //     this.gatekeeperAuthority.publicKey,
    //     this.gatekeeperNetwork,
    //     seed,
    //     expireTime
    //   )
    // );
    //
    // await send(
    //   this.connection,
    //   transaction,
    //   this.payer,
    //   this.gatekeeperAuthority
    // );

    return this.getGatewayTokenOrError(deploy);
  }

  /**
   * Issue a token to this recipient
   * @param recipient
   */
  issue(recipient: PublicKey): Promise<GatewayToken> {
    return this.issueVanilla(recipient);
  }

  /**
   * Revoke the gateway token. The token must have been issued by a gatekeeper in the same network
   * @param gatewayTokenKey
   */
  async revoke(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
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

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  /**
   * Freeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async freeze(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
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

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return this.getGatewayTokenOrError(gatewayTokenKey);
  }

  /**
   * Unfreeze the gateway token. The token must have been issued by this gatekeeper.
   * @param gatewayTokenKey
   */
  async unfreeze(gatewayTokenKey: PublicKey): Promise<GatewayToken> {
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

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return this.getGatewayTokenOrError(gatewayTokenKey);
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
    expireTime: number
  ): Promise<GatewayToken> {
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

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return this.getGatewayTokenOrError(gatewayTokenKey);
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
