// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from "buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  AccountInfo,
  AccountLayout,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { GatewayToken } from "@identity.com/solana-gateway-ts";

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

  if (info.data.length !== AccountLayout.span) {
    throw new Error("Invalid account size");
  }

  // ? Is accountInfo NOT of type AccountInfo? I'm confused as to why state does not exist on
  const data: Buffer = Buffer.from(info.data);
  const accountInfo = AccountLayout.decode(data) as AccountInfo;
  accountInfo.address = tokenAccount;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  return accountInfo;
};

export const prettyPrint = (token: GatewayToken): string =>
  JSON.stringify(
    {
      issuingGatekeeper: token.issuingGatekeeper.toBase58(),
      gatekeeperNetwork: token.gatekeeperNetwork.toBase58(),
      owner: token.owner.toBase58(),
      state: token.state,
      publicKey: token.publicKey.toBase58(),
      programId: token.programId.toBase58(),
      expiryTime: token.expiryTime,
    },
    null,
    1
  );
