import { Wallet, Provider, getDefaultProvider, Network, Signer } from "ethers";
import { TokenData, TokenState } from "../utils";
import * as assert from "assert";
import * as dotenv from "dotenv";
import { SAMPLE_PRIVATE_KEY } from "../utils/constants_test";
import { GatewayTs } from "./GatewayTs";
import {
  gatekeeperNetwork,
  gatekeeperWallet,
  TEST_GATEWAY_TOKEN_ADDRESS,
} from "./testUtils";
dotenv.config();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("GatewayTS", function () {
  this.timeout(15_000);
  let gateway: GatewayTs;
  let provider: Provider;
  let network: Network;
  let gatekeeper: Signer;

  const sampleWalletAddress = Wallet.createRandom().address;

  before("Initialize GatewayTS class", async function () {
    provider = getDefaultProvider("http://localhost:8545");
    network = await provider.getNetwork();
    gatekeeper = gatekeeperWallet(provider);

    gateway = new GatewayTs(
      gatekeeper,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken
    );
  });

  it("should get the gatekeeper network name", async () => {
    const gkn = await gateway.getGatekeeperNetwork(BigInt(1));
    assert.equal(gkn, "tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf");
  });

  it("should list all gatekeeper networks", async () => {
    const networks = await gateway.listNetworks();
    assert.equal(Object.keys(networks).length, 1);
    assert.equal(networks["tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf"], 1);
  });

  it("should issue a token", async () => {
    await gateway.issue(sampleWalletAddress, gatekeeperNetwork);

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("should tolerate multiple tokens", async () => {
    const walletWithMultipleTokens = Wallet.createRandom().address;

    await gateway
      .issue(walletWithMultipleTokens, gatekeeperNetwork)
      .then((tx) => tx.wait());
    // Wait for tx1 before tx2 otherwise the node will complain about replays
    await gateway
      .issue(walletWithMultipleTokens, gatekeeperNetwork)
      .then((tx) => tx.wait());

    // should fail
    const shouldFail = gateway.checkedGetTokenId(
      walletWithMultipleTokens,
      gatekeeperNetwork
    );
    await assert.rejects(shouldFail, Error);

    const tolerantGateway = new GatewayTs(
      gatekeeper,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken,
      { tolerateMultipleTokens: true }
    );

    // should not fail
    const tokenId = await tolerantGateway.checkedGetTokenId(
      walletWithMultipleTokens,
      gatekeeperNetwork
    );

    assert.ok(tokenId);
  });

  it("should issue a token with additional parameters", async () => {
    const address = Wallet.createRandom().address;
    const expiry = BigInt(100);
    const expectedExpiry = BigInt(Math.floor(Date.now() / 1000 + 100));
    const mask = BigInt(1);

    await gateway.issue(address, gatekeeperNetwork, expiry, mask);
    const token = await gateway.getToken(address, gatekeeperNetwork);

    assert.equal(token.expiration, expectedExpiry);
    assert.equal(token.bitmask, mask);
  });

  it("Verify gateway tokens for multiple addresses", async () => {
    let result = await gateway.verify(sampleWalletAddress, gatekeeperNetwork);
    assert.equal(result, true);

    // expect FALSE on validation if user doesn't have any token
    const dummyWallet = new Wallet(SAMPLE_PRIVATE_KEY);
    result = await gateway.verify(dummyWallet.address, gatekeeperNetwork);
    assert.equal(result, false);
  });

  context("getTokenIdsByOwnerAndNetwork", () => {
    let expiredTokenAddress: string;
    before("issue a token with a short-lived expiry", async () => {
      expiredTokenAddress = Wallet.createRandom().address;
      const expiry = BigInt(1);
      const expectedExpiry = BigInt(Math.floor(Date.now() / 1000 + 100));
      await gateway
        .issue(expiredTokenAddress, gatekeeperNetwork, expiry)
        .then((tx) => tx.wait());

      // wait for the token to expire
      await sleep(101);
    });
    context("with onlyActive flag set to true", () => {
      it("should not return any expired tokens getTokenIdsByOwnerAndNetwork", async () => {
        const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
          expiredTokenAddress,
          gatekeeperNetwork,
          true
        );
        assert.equal(tokenIds.length, 0);
      });
    });

    context("with onlyActive flag set to false", () => {
      it("when onlyActive=false is passed, should return all tokens, including expired", async () => {
        const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
          expiredTokenAddress,
          gatekeeperNetwork,
          false
        );
        assert.equal(tokenIds.length, 1);
      });

      it("when onlyActive=false is not passed, should return all tokens, including expired", async () => {
        const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
          expiredTokenAddress,
          gatekeeperNetwork
        );
        assert.equal(tokenIds.length, 1);
      });
    });

    it("getTokenIdsByOwnerAndNetwork should return an empty array on a wallet without a gateway token", async () => {
      const emptyWallet = Wallet.createRandom().address;
      const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
        emptyWallet,
        gatekeeperNetwork
      );
      assert.equal(tokenIds.length, 0);
    }).timeout(10_000);
  });

  it("Missing token returns null", async () => {
    const emptyWallet = Wallet.createRandom().address;
    const token = await gateway.getToken(emptyWallet, gatekeeperNetwork);
    assert.ok(token === null);
  }).timeout(10_000);

  it("Test token data get functions", async () => {
    const data: TokenData = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(data.state, TokenState.ACTIVE);
  }).timeout(10_000);

  it("Test token bitmask get functions", async () => {
    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );
    const targetBitmask = BigInt("0");
    assert.deepEqual(token.bitmask, targetBitmask);
  }).timeout(10_000);

  it("Test freeze", async () => {
    await gateway.freeze(sampleWalletAddress, gatekeeperNetwork);

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.state, TokenState.FROZEN);
  });

  it("Test unfreeze", async () => {
    await gateway.unfreeze(sampleWalletAddress, gatekeeperNetwork);

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("Test refresh", async () => {
    let token = await gateway.getToken(sampleWalletAddress, gatekeeperNetwork);

    const originalExpiry = token.expiration;
    await gateway.refresh(sampleWalletAddress, gatekeeperNetwork, 1000);

    token = await gateway.getToken(sampleWalletAddress, gatekeeperNetwork);

    assert.equal(token.expiration > originalExpiry, true);
  });

  it("Test subscribe", async () => {
    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    let resolvePromiseCallback: (gatewayToken: TokenData) => void;
    const resolvedPromise = new Promise<TokenData>((resolve) => {
      resolvePromiseCallback = (gatewayToken) => resolve(gatewayToken);
    });

    const subscription = gateway.onGatewayTokenChange(
      sampleWalletAddress,
      gatekeeperNetwork,
      resolvePromiseCallback
    );

    await gateway
      .refresh(sampleWalletAddress, gatekeeperNetwork, 1000)
      .then((tx) => tx.wait());

    const updatedToken = await resolvedPromise.finally(
      subscription.unsubscribe
    );

    assert.equal(updatedToken.tokenId.toString(), token.tokenId.toString());
  });
});
