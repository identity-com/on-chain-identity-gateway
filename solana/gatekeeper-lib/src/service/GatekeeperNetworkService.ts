import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  addGatekeeper,
  getGatekeeperAccountKeyFromGatekeeperAuthority,
} from "@identity.com/solana-gateway-ts";
import { send } from "../util/connection";

export class GatekeeperNetworkService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: Keypair
  ) {}

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
