import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
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
   */
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: Keypair
  ) {}

  /**
   * Add a gatekeeper to the network
   * @param gatekeeperAuthority
   */
  async addGatekeeper(gatekeeperAuthority: PublicKey): Promise<PublicKey> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(gatekeeperAuthority);

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
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(gatekeeperAuthority);
    const gatekeeperAccountInfo = await this.connection.getAccountInfo(
      gatekeeperAccount
    );

    return !!gatekeeperAccountInfo;
  }
}
