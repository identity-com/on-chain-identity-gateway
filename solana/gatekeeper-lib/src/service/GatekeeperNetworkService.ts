import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { addGatekeeper } from "../util/solana/instruction";
import {
  getGatekeeperAccountKeyFromGatekeeperAuthority,
  send,
} from "../util/solana/util";

export class GatekeeperNetworkService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: Keypair
  ) {}

  async addGatekeeper(gatekeeper: PublicKey): Promise<PublicKey> {
    const gatekeeperAccount =
      await getGatekeeperAccountKeyFromGatekeeperAuthority(gatekeeper);

    const transaction = new Transaction().add(
      addGatekeeper(
        this.payer.publicKey,
        gatekeeperAccount,
        gatekeeper,
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
}
