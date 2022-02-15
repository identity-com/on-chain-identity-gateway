import chai from "chai";
import chaiSubset from "chai-subset";
import sinon from "sinon";
import { PublicKey, Keypair } from "@solana/web3.js";
import { getFeatureAccountAddress } from "../../src";
import { describe } from "mocha";
import {
  NetworkFeature,
  UserTokenExpiry,
} from "../../src/lib/GatewayNetworkData";

chai.use(chaiSubset);
const { expect } = chai;
const sandbox = sinon.createSandbox();

describe("GatewayNetwork", () => {
  let owner: PublicKey;
  let gatekeeperKey: PublicKey;
  let gatekeeperNetworkKey: PublicKey;

  beforeEach(() => {
    owner = Keypair.generate().publicKey;
    gatekeeperKey = Keypair.generate().publicKey;
    gatekeeperNetworkKey = Keypair.generate().publicKey;
  });
  afterEach(sandbox.restore);

  context("GatekeeperNetwork Feature", () => {
    it("can correctly derive featureAccount", async () => {
      const feature = new NetworkFeature({
        userTokenExpiry: new UserTokenExpiry({}),
      });

      const featureAddress = await getFeatureAccountAddress(
        feature,
        gatekeeperNetworkKey
      );
      expect(featureAddress.toBase58()).to.equal(
        "8fbnt3ThbA1VUHgLKJuxvU4AGxzfq7tw4DrcjLik3hvn"
      );
    });
  });
});
