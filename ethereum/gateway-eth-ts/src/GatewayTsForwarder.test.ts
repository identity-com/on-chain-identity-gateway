import {BaseProvider, getDefaultProvider, TransactionReceipt} from "@ethersproject/providers";
import { BigNumber, Wallet } from "ethers";
import {TokenState} from "./utils/types";
// Not supported before v18
// eslint-disable-next-line unicorn/prefer-node-protocol
import * as assert from "assert";
import * as dotenv from "dotenv";
import {GatewayTs} from "./GatewayTs";
import {DEFAULT_FORWARDER_ADDRESS, DEFAULT_GATEWAY_TOKEN_ADDRESS, deployerWallet, gatekeeperWallet} from "./testUtils";
import {PopulatedTransaction} from "ethers/lib/ethers";
import {GatewayTsForwarder} from "./GatewayTsForwarder";
dotenv.config();

describe("GatewayTS Forwarder", function () {
  let gateway: GatewayTsForwarder;
  let provider: BaseProvider;

  let relayer: Wallet;

  const sampleWalletAddress = Wallet.createRandom().address;
  
  const relay = async (fn: () => Promise<PopulatedTransaction>): Promise<TransactionReceipt> => {
    const populatedTx = await fn();
    return (await relayer.sendTransaction(populatedTx)).wait();
  }

  before("Initialize GatewayTS class", async function () {
    this.timeout(20_000);

    provider = getDefaultProvider("http://localhost:8545");
    const network = await provider.getNetwork();

    // use the deployer account here as the relayer, as they are guaranteed to be funded by hardhat on localnet startup
    relayer = deployerWallet(provider);
    const gatekeeper = gatekeeperWallet(provider);
    
    console.log("Gatekeeper:", gatekeeper.address);
    console.log("Relayer:", relayer.address);

    gateway = new GatewayTs(gatekeeper, network, DEFAULT_GATEWAY_TOKEN_ADDRESS).forward(DEFAULT_FORWARDER_ADDRESS);
  });

  it('should issue a token', async () => {
    await relay(() => gateway.issue(sampleWalletAddress));

    const token = await gateway.getToken(sampleWalletAddress);

    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });

  it("Test freeze", async () => {
    await relay(() => gateway.freeze(sampleWalletAddress));

    const token = await gateway.getToken(sampleWalletAddress);

    assert.equal(token.state, TokenState.FROZEN);
  })

  it("Test unfreeze", async () => {
    await relay(() => gateway.unfreeze(sampleWalletAddress));

    const token = await gateway.getToken(sampleWalletAddress);

    assert.equal(token.state, TokenState.ACTIVE);
  })

  it("Test refresh", async () => {
    let token = await gateway.getToken(sampleWalletAddress);

    const originalExpiry = token.expiration;

    await relay(() => gateway.refresh(sampleWalletAddress, undefined, 1000));

    token = await gateway.getToken(sampleWalletAddress);

    assert.equal(BigNumber.from(token.expiration).gt(originalExpiry), true);
  })
});
