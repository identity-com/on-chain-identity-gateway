import {Account, Connection, PublicKey} from "@solana/web3.js";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {gatewayTokenInfo} from "../util/token";

export class RevokeService {
  constructor(private connection: Connection, private gatekeeper: Account)  {}

  async revoke(gatewayToken: PublicKey):Promise<void> {
    const accountInfo = await gatewayTokenInfo(this.connection, gatewayToken)
    const mint =  new Token(this.connection, accountInfo.mint, TOKEN_PROGRAM_ID, this.gatekeeper)

    await mint.freezeAccount(gatewayToken, this.gatekeeper, []);
  }
}
