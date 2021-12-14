import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  ConfirmOptions,
} from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountKey,
  revokeGatekeeper,
  proxyConnectionWithRetry,
  RetryConfig,
  defaultRetryConfig,
  DeepPartial,
} from "@identity.com/solana-gateway-ts";
import { send } from "../util/connection";

/**
 * Encapsulates the actions performed by a gatekeeper network authority
 */
export class GatekeeperNetworkService {
  /**
   * Construct a new gatekeeper network service
   * @param connection A solana connection object
   * @param payer The payer for any transactions performed by the network authority
   * @param gatekeeperNetwork The network authority's key
   * @param customRetryConfig RetryConfig including retry count and timeouts. All values have defaults.
   */
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: Keypair,
    customRetryConfig: DeepPartial<RetryConfig> = defaultRetryConfig
  ) {
    this.connection = proxyConnectionWithRetry(this.connection, {
      ...defaultRetryConfig,
      ...customRetryConfig,
    });
  }

  /**
   * Add a gatekeeper to the network
   * @param gatekeeperAuthority
   * @param confirmOptions
   */
  async addGatekeeper(
    gatekeeperAuthority: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<PublicKey> {
    const gatekeeperAccount = await getGatekeeperAccountKey(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );

    const transaction = new Transaction().add(
      addGatekeeper(
        this.payer.publicKey,
        gatekeeperAccount,
        gatekeeperAuthority,
        this.gatekeeperNetwork.publicKey
      )
    );

    await send(
      this.connection,
      transaction,
      confirmOptions,
      this.payer,
      this.gatekeeperNetwork
    );

    return gatekeeperAccount;
  }

  async revokeGatekeeper(
    gatekeeperAuthority: PublicKey,
    confirmOptions: ConfirmOptions = {}
  ): Promise<PublicKey> {
    const gatekeeperAccount = await getGatekeeperAccountKey(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );

    const transaction = new Transaction().add(
      revokeGatekeeper(
        this.payer.publicKey,
        gatekeeperAccount,
        gatekeeperAuthority,
        this.gatekeeperNetwork.publicKey
      )
    );

    await send(
      this.connection,
      transaction,
      confirmOptions,
      this.payer,
      this.gatekeeperNetwork
    );

    return gatekeeperAccount;
  }

  /**
   * Check if the gatekeeper already belongs to the network
   * @param gatekeeperAuthority
   */
  async hasGatekeeper(gatekeeperAuthority: PublicKey): Promise<boolean> {
    const gatekeeperAccount = await getGatekeeperAccountKey(
      gatekeeperAuthority,
      this.gatekeeperNetwork.publicKey
    );
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return !!gatekeeperAccountInfo;
  }
}
