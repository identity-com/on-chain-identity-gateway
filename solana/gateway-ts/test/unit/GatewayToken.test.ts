import chai from "chai";
import chaiSubset from "chai-subset";
import { PublicKey, Keypair, AccountInfo } from "@solana/web3.js";
import {
  PROGRAM_ID,
  Active,
  GatewayTokenData,
  GatewayTokenState,
  AssignablePublicKey,
  GatewayToken,
} from "../../src";
import { describe } from "mocha";

chai.use(chaiSubset);
const { expect } = chai;
const getAccountInfoWithState = (
  state: GatewayTokenState,
  pubkey: PublicKey,
  ownerKey: PublicKey,
  gatekeeperNetworkKey: PublicKey,
  gatekeeperKey: PublicKey
): AccountInfo<Buffer> => {
  const gtData = new GatewayTokenData({
    state,
    owner: AssignablePublicKey.fromPublicKey(ownerKey),
    issuingGatekeeper: AssignablePublicKey.fromPublicKey(gatekeeperKey),
    gatekeeperNetwork: AssignablePublicKey.fromPublicKey(gatekeeperNetworkKey),
    features: [0],
    parentGatewayToken: undefined,
    ownerIdentity: undefined,
    expiry: undefined,
  });
  return {
    executable: false,
    lamports: 0,
    owner: PROGRAM_ID,
    data: gtData.encode(),
  };
};

const samples = [
  // post-hacken-audit, with expiry time
  "AADtwj15g/A4i2zqigx/6aHt0OtVExuJmaCUbAfPzb5hegAR1KMhKBLiw/loGjYZ/TFDUNlURvQxKiA5MaGjqY/I+M4Lqz84qTrQk4d6IS6QxIUtfevJdDEya+++qh/SI6L5AAF95kxkAAAAAA==",
  // post-hacken-audit, without expiry time
  "AACKshkjAQzK0n1+4R1rYrsEZAlyTy9NPiIRTaX3Y6F5gQBZzu5AMxzJv1JSE7L48sxEAkuKO4VMr+pDfOxp/6EKMMqrbuq7p/glMQD0gYVjd9X5g3QUrsMUv6gM0wETRZTdAAAAAAAAAAAAAA==",
];

describe("GatewayToken", () => {
  const owner = Keypair.generate().publicKey;
  const gatekeeperKey = Keypair.generate().publicKey;
  const gatekeeperNetworkKey = Keypair.generate().publicKey;
  const gatewayTokenAccountKey = Keypair.generate().publicKey;

  it("should parse generated account data", () => {
    const accountInfo = getAccountInfoWithState(
      new GatewayTokenState({ active: new Active({}) }),
      gatewayTokenAccountKey,
      owner,
      gatekeeperNetworkKey,
      gatekeeperKey
    );
    const gatewayToken = GatewayToken.fromAccount(
      accountInfo,
      gatewayTokenAccountKey
    );

    expect(gatewayToken.publicKey).to.equal(gatewayTokenAccountKey);
  });

  it("should parse sample account data", () => {
    samples.forEach((sample) => {
      const buffer = Buffer.from(sample, "base64");
      const gatewayToken = GatewayToken.fromAccount(
        {
          executable: false,
          lamports: 0,
          owner: PROGRAM_ID,
          data: buffer,
        },
        gatewayTokenAccountKey
      );
      console.log(gatewayToken);
    });
  });
});
