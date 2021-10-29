import { KycTokenClient } from "@metacask/kyc-token-client";
import { CLPublicKey } from "casper-js-sdk";
import { WHITELIST_PAYMENT_AMOUNT } from "../util/constants";

/**
 * Encapsulates the actions performed by a gatekeeper network authority. This is actually not required we think given
 * the "gatekeeper" functionality is handled by the whitelisting feature in the KYC Token contract. The "master" key
 * is the only one allowed to update the minters array. This "master" key needs to be owned by either Civic or Casper!
 */
export class GatekeeperNetworkService {
  /**
   * Construct a new gatekeeper network service
   * @param kycTokenClient client wrapper to access the Casper KYC Token
   * @param gatekeeperNetwork The network authority's key
   */
  constructor(
    readonly kycTokenClient: KycTokenClient,
    // Contract hash of the KYC Token <-- hardcode based on deployment in whichever network(test/main)
    readonly gatekeeperNetwork: string
  ) {}

  /**
   * Add an admin to the contract
   * @param account account of the admin
   * @param paymentAmount
   */
  public async addAdmin(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.kycTokenClient.addAdmin(account, paymentAmount);
  }

  /**
   * Revoke admin from the contract
   * @param account
   * @param paymentAmount
   */
  public async revokeAdmin(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.kycTokenClient.revokeAdmin(account, paymentAmount);
  }

  /**
   * Add a gatekeeper to the network
   * @param account account of the gatekeeper
   * @param paymentAmount
   */
  public async addGatekeeper(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.kycTokenClient.addGatekeeper(account, paymentAmount);
  }

  /**
   * Revoke gatekeeper from the network
   * @param account
   * @param paymentAmount
   */
  public async revokeGatekeeper(
    account: CLPublicKey,
    paymentAmount = WHITELIST_PAYMENT_AMOUNT
  ): Promise<string> {
    return this.kycTokenClient.revokeGatekeeper(account, paymentAmount);
  }

  /**
   * Check if the gatekeeper already belongs to the network
   * @param account
   * @deprecated This is not really needed
   */
  async hasGatekeeper(account: CLPublicKey): Promise<boolean> {
    // TODO:
    return new Promise((r) => r(true));
    // const gatekeeperAccount = await getGatekeeperAccountKey(
    //   gatekeeperAuthority,
    //   this.gatekeeperNetwork.publicKey
    // );
    // const gatekeeperAccountInfo = await this.connection.getAccountInfo(
    //   gatekeeperAccount
    // );
    //
    // return !!gatekeeperAccountInfo;
  }
}
