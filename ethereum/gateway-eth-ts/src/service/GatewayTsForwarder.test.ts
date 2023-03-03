import {
  BaseProvider,
  getDefaultProvider,
  TransactionReceipt,
} from "@ethersproject/providers";
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
import { PopulatedTransaction } from "ethers/lib/ethers";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { Wallet } from "ethers";
import { BigNumber } from "ethers";

dotenv.config();

describe("GatewayTS Forwarder", function () {
  let gateway: GatewayTsForwarder;
  let provider: BaseProvider;

  let relayer: Wallet;

  const sampleWalletAddress = Wallet.createRandom().address;

  const relay = async (
    fn: () => Promise<PopulatedTransaction>
  ): Promise<TransactionReceipt> => {
    const populatedTx = await fn();
    return (await relayer.sendTransaction(populatedTx)).wait();
  };

  const relaySerialized = async (
    fn: () => Promise<PopulatedTransaction>
  ): Promise<TransactionReceipt> => {
    const populatedTx = await fn();
    const serialized = JSON.stringify(populatedTx);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { to, data } = JSON.parse(serialized);

    console.log(data);

    const r = await relayer.sendTransaction({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      to,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    });

    return r.wait();
  };

  before("Initialize GatewayTS class", function () {
    this.timeout(20_000);

    provider = getDefaultProvider("http://localhost:8545");

    // use the deployer account here as the relayer, as they are guaranteed to be funded by hardhat on localnet startup
    relayer = deployerWallet(provider);
    const gatekeeper = gatekeeperWallet(provider);

    console.log("Gatekeeper:", gatekeeper.address);
    console.log("Relayer:", relayer.address);

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

    assert.equal(BigNumber.from(token.expiration).gt(originalExpiry), true);
  });
});
