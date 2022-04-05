import { Connection, PublicKey } from "@solana/web3.js";
import {
  Account,
  getAccount,
} from "@solana/spl-token";
import { GatewayToken } from "@identity.com/solana-gateway-ts";

export const gatewayTokenInfo = async (
  connection: Connection,
  tokenAccount: PublicKey
): Promise<Account> => getAccount(connection, tokenAccount);

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
