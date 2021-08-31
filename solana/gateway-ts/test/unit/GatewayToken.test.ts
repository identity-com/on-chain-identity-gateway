import chai from "chai";
import chaiSubset from "chai-subset";
import { PublicKey, Keypair, AccountInfo } from "@solana/web3.js";
import { PROGRAM_ID } from "../../src/lib/constants";
import {
  Active,
  GatewayTokenData,
  GatewayTokenState,
} from "../../src/lib/GatewayTokenData";
import { AssignablePublicKey } from "../../src/lib/AssignablePublicKey";
import { describe } from "mocha";
import { GatewayToken } from "../../src";

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

describe("GatewayToken", () => {
  const owner = Keypair.generate().publicKey;
  const gatekeeperKey = Keypair.generate().publicKey;
  const gatekeeperNetworkKey = Keypair.generate().publicKey;
  const gatewayTokenAccountKey = Keypair.generate().publicKey;

  it("should parse account data", () => {
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
});
