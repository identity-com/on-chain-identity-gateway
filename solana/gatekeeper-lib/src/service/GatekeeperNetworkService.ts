import {
  Keypair,
  Connection,
  PublicKey,
  Transaction,
  SendOptions,
} from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountKey,
  revokeGatekeeper,
} from "@identity.com/solana-gateway-ts";
import { DataTransaction, send } from "../util/connection";

/**
 * Encapsulates the actions performed by a gatekeeper network authority
 */
export class GatekeeperNetworkService {
  /**
   * Construct a new gatekeeper network service
   * @param connection A solana connection object
   * @param payer The payer for any transactions performed by the network authority
   * @param gatekeeperNetwork The network authority's key
   */
  constructor(
    private readonly connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: Keypair
  ) {}

  /**
   * Add a gatekeeper to the network
   * @param gatekeeperAuthority
   * @param sendOptions
   */
  async addGatekeeper(
    gatekeeperAuthority: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<PublicKey>> {
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

    const sentTransaction = await send(
      this.connection,
      transaction,
      sendOptions,
      this.payer,
      this.gatekeeperNetwork
    );

    return sentTransaction.withData(gatekeeperAccount);
  }

  async revokeGatekeeper(
    gatekeeperAuthority: PublicKey,
    sendOptions: SendOptions = {}
  ): Promise<DataTransaction<PublicKey>> {
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

    const sentTransaction = await send(
      this.connection,
      transaction,
      sendOptions,
      this.payer,
      this.gatekeeperNetwork
    );

    return sentTransaction.withData(gatekeeperAccount);
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
