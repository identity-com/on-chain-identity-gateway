import { Keypair, Connection, PublicKey } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { gatewayTokenInfo } from "../util/token";
import { keypairToAccount } from "../util/account";

// TODO remove deprecated service
export class RevokeService {
  constructor(private connection: Connection, private gatekeeper: Keypair) {}

  async revoke(gatewayToken: PublicKey): Promise<void> {
    const accountInfo = await gatewayTokenInfo(this.connection, gatewayToken);
    const gatekeeperAccount = keypairToAccount(this.gatekeeper);
    const mint = new Token(
      this.connection,
      accountInfo.mint,
      TOKEN_PROGRAM_ID,
      gatekeeperAccount
    );

    await mint.freezeAccount(gatewayToken, this.gatekeeper, []);
  }
}
