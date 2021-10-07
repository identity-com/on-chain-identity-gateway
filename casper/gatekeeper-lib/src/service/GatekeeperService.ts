import {
  GatewayToken,
  KycTokenClient,
  State,
} from "@metacask/kyc-token-client";
import { CLPublicKey, DeployUtil } from "casper-js-sdk";
import { MINT_PAYMENT_AMOUNT, UPDATE_PAYMENT_AMOUNT } from "../util/constants";

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
   * @param issuingGatekeeper account of the gatekeeper who is allowed to issue KYC tokens
   * @param gatekeeperNetwork The network that the gatekeeper belongs to
   * @param config Global default configuration for the gatekeeper
   */
  constructor(
    readonly kycTokenClient: KycTokenClient,
    // Account of the Gatekeeper that is issuing the KYC Tokens
    readonly issuingGatekeeper: CLPublicKey,
    // Contract hash of the KYC Token <-- hardcode based on deployment in whichever network(test/main)
    readonly gatekeeperNetwork: string,
    readonly config: GatekeeperConfig = {}
  ) {}

  private getDefaultExpireTime(): string | undefined {
    // If this is not set, then set no expiry on the KYC token
    if (this.config.defaultExpirySeconds) {
      const now = Math.floor(Date.now() / 1000);
      return (now + this.config.defaultExpirySeconds).toString();
    }
    return undefined;
  }

  /**
   * Issue a KYC Token to this account
   * @param account
   * @param paymentAmount
   */
  async issue(
    account: CLPublicKey,
    paymentAmount = MINT_PAYMENT_AMOUNT
  ): Promise<string> {
    console.log(`Minting KYC Token for: ${account.toHex()}`);
    const newToken = new GatewayToken(
      this.issuingGatekeeper,
      this.gatekeeperNetwork,
      account,
      State.ACTIVE,
      this.getDefaultExpireTime()
    );

    return this.kycTokenClient.issue(newToken, paymentAmount);
  }

  /**
   * Revoke the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  async revoke(
    account: CLPublicKey,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    console.log(`Revoking KYC Token for: ${account.toHex()}`);

    return this.kycTokenClient.revoke(account, paymentAmount);
  }

  /**
   * Freeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  async freeze(
    account: CLPublicKey,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    console.log(`Freezing KYC Token for: ${account.toHex()}`);

    return this.kycTokenClient.freeze(account, paymentAmount);
  }

  /**
   * Unfreeze the KYC Token belonging to this account
   * @param account
   * @param paymentAmount
   */
  async unfreeze(
    account: CLPublicKey,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    console.log(`Unfreezing KYC Token for: ${account.toHex()}`);

    return this.kycTokenClient.unfreeze(account, paymentAmount);
  }

  /**
   * Returns a gateway token owned by this account, if it exists
   * @param account
   */
  async findGatewayTokenForOwner(
    account: CLPublicKey
  ): Promise<GatewayToken | undefined> {
    return this.kycTokenClient.getGatewayToken(account);
  }

  /**
   * Update the expiry time of the KYC Token
   * @param account
   * @param expireTime
   * @param paymentAmount
   */
  async updateExpiry(
    account: CLPublicKey,
    expireTime?: string,
    paymentAmount = UPDATE_PAYMENT_AMOUNT
  ): Promise<string> {
    console.log(`Updating Expiry of KYC Token for: ${account.toHex()}`);

    return this.kycTokenClient.updateExpiry(account, expireTime, paymentAmount);
  }

  /**
   * Use this function to poll the deployment hash to check if it has hit the blockchain, this will throw an exception
   * if there is an error with the deployment. If the promise is empty, means nothing has hit the blockchain yet!
   * @param deployHash
   */
  async confirmDeploy(
    deployHash: string
  ): Promise<DeployUtil.Deploy | undefined> {
    return this.kycTokenClient.confirmDeploy(deployHash);
  }

  // equivalent to GatekeeperNetworkService.hasGatekeeper, but requires no network private key
  async isRegistered(): Promise<boolean> {
    // TODO:
    return new Promise((resolve) => resolve(true));
    // const gatekeeperAccount = await getGatekeeperAccountKey(
    //   this.gatekeeperAuthority.publicKey,
    //   this.gatekeeperNetwork
    // );
    // const gatekeeperAccountInfo = await this.connection.getAccountInfo(
    //   gatekeeperAccount
    // );
    //
    // return !!gatekeeperAccountInfo;
  }
}
