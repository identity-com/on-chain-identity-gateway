import { GatewayTsCallData } from "./GatewayTsCallData";
import { BaseProvider, getDefaultProvider } from "@ethersproject/providers";
import { BigNumber, utils, Wallet } from "ethers";
import { gatewayTokenAddresses } from "./lib/gatewaytokens";
import { addresses } from "./lib/addresses";
import { DEFAULT_EXPIRATION_BN, ZERO_BN } from "./utils/constants";
import { FunctionFragment } from "@ethersproject/abi";
import { getExpirationTime } from "./utils/time";
import { addFlagsToBitmask } from "./utils/bitmask_flags";
import { BytesLike, hexDataSlice, id } from "ethers/lib/utils";
import { generateId } from "./utils/tokenId";
import assert = require("assert");
import * as dotenv from "dotenv";
import { SAMPLE_WALLET_ADDRESS } from "./utils/constants_test";
dotenv.config();

const computeCallData = (
  sigHash: string | utils.BytesLike,
  argsTypes: Array<string>,
  args: Array<any>
) => utils.hexConcat([sigHash, utils.defaultAbiCoder.encode(argsTypes, args)]);

const computeSigHash = (fragment: FunctionFragment): BytesLike =>
  hexDataSlice(id(fragment.format()), 0, 4);

describe("Test GatewayTSCallData class", function () {
  const ropstenNetworkID = 3;
  let gatewayLib: GatewayTsCallData;
  let provider: BaseProvider;
  let wallet: Wallet;
  let defaultGatewayToken: string;
  const defaultGas: number | BigNumber = 6_000_000;
  const defaultGasPrice: number | BigNumber = 1_000_000_000_000;

  const sampleWalletAddress = SAMPLE_WALLET_ADDRESS;
  const sampleTokenId = 124_678;

  before("Initialize GatewayTSBase class", async () => {
    provider = getDefaultProvider("ropsten", {
      infura: process.env.INFURA_KEY,
    });
    wallet = new Wallet(`0x${process.env.PRIVATE_KEY}`);
    wallet = wallet.connect(provider);
    defaultGatewayToken = gatewayTokenAddresses[ropstenNetworkID][0].address;
    gatewayLib = new GatewayTsCallData(provider, wallet);

    await gatewayLib.init(defaultGatewayToken);
    const networkId = (await gatewayLib.provider.getNetwork()).chainId;

    assert.equal(gatewayLib.defaultGatewayToken, defaultGatewayToken);
    assert.equal(gatewayLib.wallet, wallet);
    assert.equal(networkId, ropstenNetworkID);
    assert.equal(gatewayLib.defaultGas, defaultGas);
    assert.equal(gatewayLib.defaultGasPrice, defaultGasPrice);
    assert.equal(gatewayLib.contractAddresses, addresses[ropstenNetworkID]);
  });

  it("Test mint token functions, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.generateTokenId(sampleWalletAddress);
    const expiration = getExpirationTime(DEFAULT_EXPIRATION_BN);
    const bitmask = addFlagsToBitmask(ZERO_BN, [0, 1]);

    const args = [sampleWalletAddress, tokenId, expiration, bitmask];
    const argsTypes = ["address", "uint256", "uint256", "uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["mint(address,uint256,uint256,uint256)"];
    const sigHash = computeSigHash(fragment);
    const transaction = await gatewayLib.issue(
      sampleWalletAddress,
      tokenId,
      DEFAULT_EXPIRATION_BN,
      bitmask
    );
    const calldata = computeCallData(sigHash, argsTypes, args);
    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  it("Try to mint token with existing tokenId, expect revert", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(sampleWalletAddress);
    await assert.rejects(
      gatewayLib.issue(sampleWalletAddress, tokenId, 0, ZERO_BN)
    );
  }).timeout(10_000);

  it("Try to mint token with invalid bitmask, expect revert", async () => {
    const tokenId = await gatewayLib.generateTokenId(sampleWalletAddress);
    await assert.rejects(
      gatewayLib.issue(
        sampleWalletAddress,
        tokenId,
        0,
        BigNumber.from("555124")
      )
    );
  }).timeout(4000);

  it("Test revoke token function, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(sampleWalletAddress);
    const transaction = await gatewayLib.revoke(tokenId);

    const args = [tokenId];
    const argsTypes = ["uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["revoke(uint256)"];
    const sigHash = computeSigHash(fragment);
    const calldata = computeCallData(sigHash, argsTypes, args);

    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  // it('Try to revoke non-existing token, expect revert', async () => {
  //     await assert.rejects(gatewayLib.revoke(sampleTokenId));
  // }).timeout(4000);

  // TODO: Reenable fixed test
  it("Test burn token function, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(sampleWalletAddress);
    const args = [tokenId];
    const argsTypes = ["uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["burn(uint256)"];

    const sigHash = computeSigHash(fragment);
    const transaction = await gatewayLib.burn(tokenId);
    const calldata = computeCallData(sigHash, argsTypes, args);
    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  it("Try to burn non-existing token, expect revert", async () => {
    await assert.rejects(gatewayLib.burn(sampleTokenId));
  }).timeout(4000);

  it("Test freeze token function, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(sampleWalletAddress);
    const transaction = await gatewayLib.freeze(tokenId);

    const args = [tokenId];
    const argsTypes = ["uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["freeze(uint256)"];
    const sigHash = computeSigHash(fragment);
    const calldata = computeCallData(sigHash, argsTypes, args);

    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  it("Try to freeze non-existing token, expect revert", async () => {
    await assert.rejects(gatewayLib.freeze(sampleTokenId));
  }).timeout(10_000);

  it("Try to freeze token with FROZEN state, expect revert", async () => {
    const constrains = BigNumber.from("2");
    const tokenId = generateId(sampleWalletAddress, constrains);
    await assert.rejects(gatewayLib.freeze(tokenId));
  }).timeout(10_000);

  it("Test unfreeze token function, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(
      "0xCE2d6E7426D95AA206775fd86DBde00Ae621bE14"
    );
    const transaction = await gatewayLib.unfreeze(tokenId);

    const args = [tokenId];
    const argsTypes = ["uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["unfreeze(uint256)"];
    const sigHash = computeSigHash(fragment);
    const calldata = computeCallData(sigHash, argsTypes, args);

    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  it("Try to unfreeze token with ACTIVE state, expect revert", async () => {
    const tokenId = await gatewayLib.generateTokenId(sampleWalletAddress);
    await assert.rejects(gatewayLib.unfreeze(tokenId));
  }).timeout(4000);

  it("Try to unfreeze non-existing token, expect revert", async () => {
    await assert.rejects(gatewayLib.unfreeze(sampleTokenId));
  }).timeout(4000);

  it("Test refresh token function, should pass calldata checks", async () => {
    const tokenId = await gatewayLib.getDefaultTokenId(sampleWalletAddress);
    const argsTypes = ["uint256", "uint256"];
    const fragment: FunctionFragment =
      gatewayLib.gatewayTokens[defaultGatewayToken].tokenInstance.contract
        .interface.functions["setExpiration(uint256,uint256)"];

    const expiry = DEFAULT_EXPIRATION_BN.mul(BigNumber.from("2")); // 28 days
    const expiration = getExpirationTime(expiry);
    const transaction = await gatewayLib.refresh(tokenId, expiry);

    const args = [tokenId, expiration];
    const sigHash = computeSigHash(fragment);
    const calldata = computeCallData(sigHash, argsTypes, args);
    assert.equal(transaction.data, calldata);
  }).timeout(10_000);

  it("Try to refresh non-existing token, expect revert", async () => {
    const expiration = getExpirationTime();
    await assert.rejects(gatewayLib.refresh(sampleTokenId, expiration));
  }).timeout(4000);

  it("Try to initialize library with incorrect default token, expect default gateway token used with 0 index", async () => {
    gatewayLib = new GatewayTsCallData(provider, wallet);
    await gatewayLib.init("0xa16E02E87b7454126E5E10d957A927A7F5B5d2be");
    assert.notEqual(
      gatewayLib.defaultGatewayToken,
      "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be"
    );

    const gatewayToken = gatewayLib.getGatewayTokenContract();
    assert.equal(
      gatewayToken.contract.address,
      gatewayTokenAddresses[ropstenNetworkID][0].address
    );
  });
});
