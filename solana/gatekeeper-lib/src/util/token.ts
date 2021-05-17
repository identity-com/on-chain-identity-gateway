import { Buffer } from "buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  AccountInfo,
  AccountLayout,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const gatewayTokenInfo = async (
  connection: Connection,
  tokenAccount: PublicKey
): Promise<AccountInfo> => {
  const info = await connection.getAccountInfo(tokenAccount);

  if (info === null) {
    throw new Error("Account not found");
  }

  if (!info.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error("Not an SPL Token");
  }

  if (info.data.length != AccountLayout.span) {
    throw new Error("Invalid account size");
  }

  const data = Buffer.from(info.data);
  const accountInfo = AccountLayout.decode(data);
  accountInfo.address = tokenAccount;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  return accountInfo;
};
