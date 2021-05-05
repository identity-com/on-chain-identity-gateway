import {Account, Connection, PublicKey} from "@solana/web3.js";
import {Token, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {gatewayTokenInfo} from "../util/token";

type Result = {
  gatekeeper: string,
  owner: string,
  revoked: boolean
}

export class VerifyService {
  constructor(private connection: Connection)  {}

  async verify(gatewayToken: PublicKey):Promise<Result> {
    const accountInfo = await gatewayTokenInfo(this.connection, gatewayToken)

    const mint =  new Token(this.connection, accountInfo.mint, TOKEN_PROGRAM_ID, new Account())
    const mintInfo = await mint.getMintInfo();

    return {
      gatekeeper: mintInfo.mintAuthority?.toBase58() as string,
      owner: accountInfo.owner.toBase58(),
      revoked: accountInfo.isFrozen
    };
  }
}
