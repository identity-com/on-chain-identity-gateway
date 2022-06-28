import {BaseProvider, getDefaultProvider, Network} from "@ethersproject/providers";
import { BigNumber, Wallet } from "ethers";
import {TokenData, TokenState} from "../utils/types";
// Not supported before v18
// eslint-disable-next-line unicorn/prefer-node-protocol
import * as assert from "assert";
import * as dotenv from "dotenv";
import {
  SAMPLE_PRIVATE_KEY,
} from "../utils/constants_test";
import {GatewayTs} from "./GatewayTs";
import {DEFAULT_GATEWAY_TOKEN_ADDRESS, gatekeeperWallet} from "./testUtils";
dotenv.config();

describe("GatewayTS", function () {
  let gateway: GatewayTs;
  let provider: BaseProvider;
  let network: Network;
  let gatekeeper: Wallet;

  const sampleWalletAddress = Wallet.createRandom().address;

  const dummyWalletAddress = "0x2de1EFea6044b44432aedBC9f29861296695AF0C";

  before("Initialize GatewayTS class", async function () {
    this.timeout(20_000);

    provider = getDefaultProvider("http://localhost:8545");
    network = await provider.getNetwork();
    gatekeeper = gatekeeperWallet(provider);
    gateway = new GatewayTs(gatekeeper, network, DEFAULT_GATEWAY_TOKEN_ADDRESS);
  });

  it('should issue a token', async () => {
    await (await gateway.issue(sampleWalletAddress)).wait();
    
    const token = await gateway.getToken(sampleWalletAddress);
    
    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("Verify gateway tokens for multiple addresses", async () => {
    let result = await gateway.verify(sampleWalletAddress);
    assert.equal(result, true);

    // expect FALSE on validation if user doesn't have any token
    const dummyWallet = new Wallet(SAMPLE_PRIVATE_KEY);
    result = await gateway.verify(dummyWallet.address);
    assert.equal(result, false);
  }).timeout(10_000);

  context("token id generation", () => {
    const knownAddress = "0x2de1EFea6044b44432aedBC9f29861296695AF0C";

    it("Test token id generation without constraints", () => {
      const targetTokenId = "0x2de1efea6044b44432aedbc9f29861296695af0c";
      
      const tokenId = gateway.generateTokenId(
        knownAddress
      );
      assert.equal(tokenId.toHexString(), targetTokenId);
    });
    
    it("Test token id generation with constraints", () => {
      let constraints = BigNumber.from("251");

      let tokenId = gateway.generateTokenId(
        knownAddress,
        constraints
      );
      assert.equal(tokenId.toHexString(), "0xfb2de1efea6044b44432aedbc9f29861296695af0c");

      constraints = BigNumber.from("251785634");
      tokenId = gateway.generateTokenId(
        knownAddress,
        constraints
      );
      assert.equal(tokenId.toHexString(), "0x0f01f1a22de1efea6044b44432aedbc9f29861296695af0c");
    });
  });

  it("getTokenId", async () => {
    const tokenId = await gateway.getTokenId(sampleWalletAddress);
    assert.ok(tokenId.toString());
  });
  
  it("getTokenId should return 0 on a wallet without a gateway token", async () => {
    const tokenId = await gateway.getTokenId(dummyWalletAddress);
    assert.equal(tokenId.toString(), "0");
  }).timeout(10_000);

  it("Test token state get functions", async () => {
    let state = await gateway.getTokenState(sampleWalletAddress);
    assert.equal(state, TokenState.ACTIVE);

    // expect state being active for any non-existing token TODO FIX
    state = await gateway.getTokenState(dummyWalletAddress);
    assert.equal(state, TokenState.ACTIVE);
  }).timeout(10_000);

  it("Test token data get functions", async () => {
    const data: TokenData = await gateway.getToken(sampleWalletAddress);
    
    assert.equal(data.state, TokenState.ACTIVE);
  }).timeout(10_000);

  it("Test token bitmask get functions", async () => {
    const token = await gateway.getToken(
      sampleWalletAddress
    );
    const targetBitmask = BigNumber.from("0");
    assert.deepEqual(token.bitmask, targetBitmask);
  }).timeout(10_000);
  
  it("Test freeze", async () => {
    await gateway.freeze(sampleWalletAddress);
    
    const token = await gateway.getToken(sampleWalletAddress);
    
    assert.equal(token.state, TokenState.FROZEN);
  })

  it("Test unfreeze", async () => {
    await gateway.unfreeze(sampleWalletAddress);

    const token = await gateway.getToken(sampleWalletAddress);

    assert.equal(token.state, TokenState.ACTIVE);
  })

  it("Test refresh", async () => {
    let token = await gateway.getToken(sampleWalletAddress);
    
    const originalExpiry = token.expiration; 
    
    await gateway.refresh(sampleWalletAddress, undefined, 1000);

    token = await gateway.getToken(sampleWalletAddress);

    assert.equal(BigNumber.from(token.expiration).gt(originalExpiry), true);
  })
});
