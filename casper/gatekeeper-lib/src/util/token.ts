import { GatewayToken } from "@metacask/kyc-token-client";

export const prettyPrint = (token: GatewayToken) =>
  JSON.stringify(
    {
      issuingGatekeeper: token.issuingGatekeeper.toHex(),
      gatekeeperNetwork: token.gatekeeperNetwork,
      owner: token.account.toHex(),
      status: token.status,
      tokenId: token.tokenId,
      expiryTime: token.expiryTime,
    },
    null,
    1
  );
