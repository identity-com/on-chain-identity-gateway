import {
  Provider,
  TransactionReceipt,
  getDefaultProvider,
  Signer,
} from "ethers";
import { TokenState } from "../utils";
import * as assert from "assert";
import * as dotenv from "dotenv";
import { GatewayTs } from "./GatewayTs";
import {
  deployerWallet,
  gatekeeperNetwork,
  gatekeeperWallet,
  TEST_GATEWAY_TOKEN_ADDRESS,
} from "./testUtils";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { ContractTransaction, ethers, Wallet } from "ethers";
import {
  approveERC20Charge,
  approveInternalERC20Charge,
  makeERC20Charge,
  makeWeiCharge,
} from "../utils/charge";

dotenv.config();

// A JSON stringifier that supports bigint, because JSON.stringify doesn't know how to handle that natively
const bigintStringifier = (key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value;

describe("GatewayTS Forwarder", function () {
  this.timeout(15_000);
  let gateway: GatewayTsForwarder;
  let provider: Provider;

  let gatekeeper: Signer;
  let relayer: Signer;

  const sampleWalletAddress = Wallet.createRandom().address;

  const relay = async (
    fn: () => Promise<ContractTransaction>
  ): Promise<TransactionReceipt> => {
    const populatedTx = await fn();
    return (await relayer.sendTransaction(populatedTx)).wait();
  };

  const estimateGas = async (
    fn: () => Promise<ContractTransaction>
  ): Promise<bigint> => {
    const populatedTx = await fn();
    const serialized = JSON.stringify(populatedTx, bigintStringifier);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { to, data, value } = JSON.parse(serialized);

    return relayer.estimateGas({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      to,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value,
    });
  };

  const relaySerialized = async (
    fn: () => Promise<ContractTransaction>
  ): Promise<TransactionReceipt> => {
    const populatedTx = await fn();
    const serialized = JSON.stringify(populatedTx, bigintStringifier);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { to, data, value } = JSON.parse(serialized);

    const r = await relayer.sendTransaction({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      to,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value,
    });

    return r.wait();
  };

  // address of the erc20 token used for testing (obtainable from the output of yarn pretest)
  const ERC20_TOKEN = "0x5C341B3429ac43bC81804382ae233dD6c7E9F6Ae";
  const erc20Balance = (address: string): Promise<bigint> => {
    // check erc20 balance
    const contract = new ethers.Contract(
      ERC20_TOKEN,
      [
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
      ],
      provider
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return contract.balanceOf(address);
  };

  before("Initialize GatewayTS class", function () {
    provider = getDefaultProvider("http://localhost:8545");

    // use the deployer account here as the relayer, as they are guaranteed to be funded by hardhat on localnet startup
    relayer = deployerWallet(provider);
    gatekeeper = gatekeeperWallet(provider);

    gateway = new GatewayTs(
      gatekeeper,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken
    ).forward(TEST_GATEWAY_TOKEN_ADDRESS.forwarder);
  });

  it("should issue a token", async () => {
    await relaySerialized(() =>
      gateway.issue(sampleWalletAddress, gatekeeperNetwork)
    );

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("should issue a token with an eth charge", async () => {
    const gatekeeperBalanceBefore = await provider.getBalance(gatekeeper);

    const wallet = Wallet.createRandom().address;
    const chargeValue = BigInt(1000);
    const charge = makeWeiCharge(chargeValue, await gatekeeper.getAddress());
    await relaySerialized(() =>
      gateway.issue(wallet, gatekeeperNetwork, undefined, undefined, charge)
    );

    const gatekeeperBalanceAfter = await provider.getBalance(gatekeeper);

    assert.equal(chargeValue, gatekeeperBalanceAfter - gatekeeperBalanceBefore);
  });

  it("should issue a token with an ERC20 charge", async () => {
    const wallet = Wallet.createRandom().address;
    const chargeValue = BigInt(1000);

    const charge = makeERC20Charge(
      chargeValue,
      ERC20_TOKEN,
      await relayer.getAddress(), // we are making the relayer pay (not the gateway token recipient)
      await gatekeeper.getAddress()
    );

    const approveTx = await approveERC20Charge(
      charge,
      provider,
      TEST_GATEWAY_TOKEN_ADDRESS.chargeHandler
    );

    const internalApproveTx = await approveInternalERC20Charge(
      charge,
      gatekeeperNetwork,
      provider,
      TEST_GATEWAY_TOKEN_ADDRESS.chargeHandler,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken
    );

    const payerBalanceBefore = await erc20Balance(await relayer.getAddress());
    const gatekeeperBalanceBefore = await erc20Balance(
      await gatekeeper.getAddress()
    );

    await (await relayer.sendTransaction(approveTx)).wait();
    await (await relayer.sendTransaction(internalApproveTx)).wait();

    await relaySerialized(() =>
      gateway.issue(wallet, gatekeeperNetwork, undefined, undefined, charge)
    );

    const payerBalanceAfter = await erc20Balance(await relayer.getAddress());
    const gatekeeperBalanceAfter = await erc20Balance(
      await gatekeeper.getAddress()
    );

    // the gatekeeper's balance has gone up
    assert.equal(chargeValue, gatekeeperBalanceAfter - gatekeeperBalanceBefore);

    // the payer's balance has gone down
    assert.equal(chargeValue, payerBalanceBefore - payerBalanceAfter);
  });

  it("Test freeze", async () => {
    await relay(() => gateway.freeze(sampleWalletAddress, gatekeeperNetwork));

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.state, TokenState.FROZEN);
  });

  it("Test unfreeze", async () => {
    await relay(() => gateway.unfreeze(sampleWalletAddress, gatekeeperNetwork));

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("Test refresh", async () => {
    let token = await gateway.getToken(sampleWalletAddress, gatekeeperNetwork);

    const originalExpiry = token.expiration;

    await relay(() =>
      gateway.refresh(sampleWalletAddress, gatekeeperNetwork, 1000)
    );

    token = await gateway.getToken(sampleWalletAddress, gatekeeperNetwork);

    assert.equal(token.expiration > originalExpiry, true);
  });

  it("Test refresh with an eth charge", async () => {
    const gatekeeperBalanceBefore = await provider.getBalance(gatekeeper);

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );
    const chargeValue = BigInt(1000);
    const charge = makeWeiCharge(chargeValue, await gatekeeper.getAddress());

    await relay(() =>
      gateway.refresh(sampleWalletAddress, gatekeeperNetwork, 1000, charge)
    );

    const gatekeeperBalanceAfter = await provider.getBalance(gatekeeper);

    assert.equal(chargeValue, gatekeeperBalanceAfter - gatekeeperBalanceBefore);
  });

  it("should allow parameterisable gas limit for the internal transaction", async () => {
    const parameterisedGateway = new GatewayTs(
      gatekeeper,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken,
      { gasLimit: 10_000_000 }
    ).forward(TEST_GATEWAY_TOKEN_ADDRESS.forwarder);

    // setting the gas limit too high in the forwarder means that the
    // internal transaction will fail, as the forwarder will reject
    // due to the 1/64th rule, unless the estimateGas call raises the limit
    // of the external transaction
    const estimatedGasWithHighLimit = await estimateGas(() =>
      parameterisedGateway.issue(sampleWalletAddress, gatekeeperNetwork)
    );
    const estimatedGasWithNormalLimit = await estimateGas(() =>
      gateway.issue(sampleWalletAddress, gatekeeperNetwork)
    );

    assert.ok(estimatedGasWithHighLimit > estimatedGasWithNormalLimit);
  });
});
