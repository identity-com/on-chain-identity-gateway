import { GatewayTsBase } from "./GatewayTsBase";
import { BaseProvider, getDefaultProvider } from "@ethersproject/providers";
import { BigNumber, utils, Wallet } from "ethers";
import { gatewayTokenAddresses } from "./lib/gatewaytokens";
import { addresses } from "./lib/addresses";
import { ONE_BN, ZERO_BN } from "./utils/constants";
import { TokenData } from "./utils/types";
// Not supported before v18
// eslint-disable-next-line unicorn/prefer-node-protocol
import * as assert from "assert";
import * as dotenv from "dotenv";
import {
  SAMPLE_PRIVATE_KEY,
  SAMPLE_WALLET_ADDRESS,
} from "./utils/constants_test";
dotenv.config();

const generateTokenId = (wallet: string, constrains: BigNumber): string => {
  const hexConstrains = utils.hexlify(constrains);
  const resultHexString = utils.hexZeroPad(hexConstrains + wallet.slice(2), 32);
  const parsedHexString = utils.hexlify(resultHexString);
  return BigNumber.from(parsedHexString).toHexString();
};

describe("Test GatewayTSBase class", function () {
  const ropstenNetworkID = 3;
  let gatewayBase: GatewayTsBase;
  let provider: BaseProvider;
  let defaultGatewayToken: string;
  const defaultGas: number | BigNumber = 6_000_000;

  const sampleWalletAddress = SAMPLE_WALLET_ADDRESS;
  const defaultGasPrice: number | BigNumber = 1_000_000_000_000;

  const dummyWalletAddress = "0x2de1EFea6044b44432aedBC9f29861296695AF0C";
  const sampleTokenId = 124_678;

  before("Initialize GatewayTSBase class", async () => {
    provider = getDefaultProvider("ropsten", {
      infura: process.env.INFURA_KEY,
    });
    const network = await provider.getNetwork();
    defaultGatewayToken = gatewayTokenAddresses[ropstenNetworkID][0].address;
    gatewayBase = new GatewayTsBase(provider, network, defaultGatewayToken);

    assert.equal(gatewayBase.defaultGatewayToken, defaultGatewayToken);
    assert.equal(gatewayBase.providerOrSigner, provider);
    assert.equal(network.chainId, ropstenNetworkID);
    assert.equal(gatewayBase.defaultGas, defaultGas);
    assert.equal(gatewayBase.defaultGasPrice, defaultGasPrice);
    assert.equal(gatewayBase.contractAddresses, addresses[ropstenNetworkID]);
  });

  it.skip("Verify gateway tokens for multiple addresses", async () => {
    let result = await gatewayBase.verify(sampleWalletAddress);
    assert.equal(result, true);

    // expect FALSE on validation if user doesn't have any token
    const dummyWallet = new Wallet(SAMPLE_PRIVATE_KEY);
    result = await gatewayBase.verify(dummyWallet.address);
    assert.equal(result, false);
  }).timeout(10_000);

  it("Test token balances", async () => {
    let result = await gatewayBase.getTokenBalance(sampleWalletAddress);
    const actualResult = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getBalance(sampleWalletAddress);
    assert.equal(result.toString(), actualResult.toString());

    // expect balance to be 0 on wallet without tokens
    const dummyWallet = new Wallet(SAMPLE_PRIVATE_KEY);
    result = await gatewayBase.getTokenBalance(dummyWallet.address);
    assert.equal(result.toString(), "0");
  }).timeout(10_000);

  it("Test token id generation", async () => {
    let constrains = BigNumber.from("251");
    let tokenId = await gatewayBase.generateTokenId(
      sampleWalletAddress,
      constrains
    );
    let targetTokenId = generateTokenId(sampleWalletAddress, constrains);
    assert.equal(tokenId.toHexString(), targetTokenId);

    constrains = BigNumber.from("251785634");
    tokenId = await gatewayBase.generateTokenId(
      sampleWalletAddress,
      constrains
    );
    targetTokenId = generateTokenId(sampleWalletAddress, constrains);
    assert.equal(tokenId.toHexString(), targetTokenId);

    // expect tokenId to be equal current balance + 1 and owner address
    constrains = BigNumber.from("0");
    const tokenBalance: BigNumber = await gatewayBase.getTokenBalance(
      sampleWalletAddress
    );
    tokenId = await gatewayBase.generateTokenId(
      sampleWalletAddress,
      constrains
    );
    targetTokenId = generateTokenId(
      sampleWalletAddress,
      tokenBalance.add(ONE_BN)
    );
    assert.equal(tokenId.toHexString(), targetTokenId);
  }).timeout(10_000);

  it("Test getting default token id", async () => {
    let tokenId = await gatewayBase.getDefaultTokenId(sampleWalletAddress);
    const targetTokenId = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getTokenId(sampleWalletAddress);
    assert.equal(tokenId.toString(), targetTokenId.toString());

    // expect tokenId to be equal 0 on wallet without tokens
    tokenId = await gatewayBase.getDefaultTokenId(dummyWalletAddress);
    assert.equal(tokenId.toString(), "0");
  }).timeout(10_000);

  it("Test token state get functions", async () => {
    const tokenId = await gatewayBase.getDefaultTokenId(sampleWalletAddress);
    let state = await gatewayBase.getTokenState(tokenId);
    assert.equal(state, "ACTIVE");

    // expect state being active for any non-existing token
    state = await gatewayBase.getTokenState(0);
    assert.equal(state, "ACTIVE");

    state = await gatewayBase.getTokenState(235_789);
    assert.equal(state, "ACTIVE");
  }).timeout(10_000);

  it("Test token data get functions", async () => {
    const tokenId = await gatewayBase.getDefaultTokenId(sampleWalletAddress);
    const data: TokenData = await gatewayBase.getTokenData(tokenId, true);
    const tokenExpiration = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getExpiration(tokenId);
    const tokenIdentity = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getIdentity(tokenId);
    const tokenBitmask = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getTokenBitmask(tokenId);

    const targetData: TokenData = {
      bitmask: tokenBitmask.toString(),
      expiration: tokenExpiration.toString(),
      identity: tokenIdentity,
      owner: sampleWalletAddress,
      state: "ACTIVE",
    };
    assert.deepEqual(data, targetData);

    // expect to throw error on non-existing token
    await assert.rejects(gatewayBase.getTokenData(sampleTokenId));
  }).timeout(10_000);

  it("Test token bitmask get functions", async () => {
    const tokenId = await gatewayBase.getDefaultTokenId(sampleWalletAddress);
    let bitmask: number | BigNumber = await gatewayBase.getTokenBitmask(
      tokenId
    );
    const targetBitmask = await gatewayBase.gatewayTokens[
      defaultGatewayToken
    ].tokenInstance.getTokenBitmask(tokenId);

    assert.deepEqual(bitmask, targetBitmask);

    bitmask = await gatewayBase.getTokenBitmask(sampleTokenId);
    assert.deepEqual(bitmask, ZERO_BN);
  }).timeout(10_000);
});
