import {
  BaseProvider,
  getDefaultProvider,
  Network,
} from "@ethersproject/providers";
import { BigNumber, Wallet } from "ethers";
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

describe("GatewayTS", function () {
  this.timeout(5_000);
  let gateway: GatewayTs;
  let provider: BaseProvider;
  let network: Network;
  let gatekeeper: Wallet;

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
    await (await gateway.issue(sampleWalletAddress, gatekeeperNetwork)).wait();

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("should tolerate multiple tokens", async () => {
    const walletWithMultipleTokens = Wallet.createRandom().address;

    await (
      await gateway.issue(walletWithMultipleTokens, gatekeeperNetwork)
    ).wait();
    await (
      await gateway.issue(walletWithMultipleTokens, gatekeeperNetwork)
    ).wait();

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
    const expiry = BigNumber.from(100);
    const expectedExpiry = BigNumber.from(Math.floor(Date.now() / 1000 + 100));
    const mask = BigNumber.from(1);
    await (
      await gateway.issue(address, gatekeeperNetwork, expiry, mask)
    ).wait();

    const token = await gateway.getToken(address, gatekeeperNetwork);

    assert.equal(token.expiration.toNumber(), expectedExpiry.toNumber());
    assert.equal(token.bitmask.toNumber(), mask.toNumber());
  });

  it("Verify gateway tokens for multiple addresses", async () => {
    let result = await gateway.verify(sampleWalletAddress, gatekeeperNetwork);
    assert.equal(result, true);

    // expect FALSE on validation if user doesn't have any token
    const dummyWallet = new Wallet(SAMPLE_PRIVATE_KEY);
    result = await gateway.verify(dummyWallet.address, gatekeeperNetwork);
    assert.equal(result, false);
  }).timeout(10_000);

  it("getTokenIdsByOwnerAndNetwork", async () => {
    const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
      sampleWalletAddress,
      gatekeeperNetwork
    );
    assert.ok(tokenIds.toString());
  });

  it("getTokenIdsByOwnerAndNetwork should return an empty array on a wallet without a gateway token", async () => {
    const emptyWallet = Wallet.createRandom().address;
    const tokenIds = await gateway.getTokenIdsByOwnerAndNetwork(
      emptyWallet,
      gatekeeperNetwork
    );
    assert.equal(tokenIds.length, 0);
  }).timeout(10_000);

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
    const targetBitmask = BigNumber.from("0");
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

    assert.equal(BigNumber.from(token.expiration).gt(originalExpiry), true);
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

    await gateway.refresh(sampleWalletAddress, gatekeeperNetwork, 1000);

    const updatedToken = await resolvedPromise.finally(
      subscription.unsubscribe
    );

    assert.equal(updatedToken.tokenId.toString(), token.tokenId.toString());
  });
});
