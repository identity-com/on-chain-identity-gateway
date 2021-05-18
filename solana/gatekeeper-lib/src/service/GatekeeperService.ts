import { Keypair, Connection, PublicKey, Transaction } from "@solana/web3.js";
import { issueVanilla } from "../util/solana/instruction";
import { getGatewayTokenKeyForOwner, send } from "../util/solana/util";

export class GatekeeperService {
  constructor(
    private connection: Connection,
    private payer: Keypair,
    private gatekeeperNetwork: PublicKey,
    private gatekeeperAccount: PublicKey,
    private gatekeeperAuthority: Keypair
  ) {}

  async issueVanilla(owner: PublicKey, seed: Uint8Array) {
    const gatewayTokenKey = await getGatewayTokenKeyForOwner(owner);
    const transaction = new Transaction().add(
      issueVanilla(
        seed,
        gatewayTokenKey,
        this.payer.publicKey,
        this.gatekeeperAccount,
        owner,
        this.gatekeeperAuthority.publicKey,
        this.gatekeeperNetwork
      )
    );

    await send(
      this.connection,
      transaction,
      this.payer,
      this.gatekeeperAuthority
    );

    return gatewayTokenKey;
  }
}
