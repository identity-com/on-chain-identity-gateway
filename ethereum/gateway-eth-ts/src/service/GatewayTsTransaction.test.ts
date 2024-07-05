import { TokenState } from "../utils";
import * as assert from "assert";
import * as dotenv from "dotenv";
import { GatewayTs } from "./GatewayTs";
import {
  gatekeeperNetwork,
  gatekeeperWallet,
  TEST_GATEWAY_TOKEN_ADDRESS,
} from "./testUtils";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { getDefaultProvider, Provider, Signer, Wallet } from "ethers";

dotenv.config();

describe("GatewayTS Transaction", function () {
  this.timeout(15_000);
  let gateway: GatewayTsForwarder;
  let provider: Provider;

  let gatekeeper: Signer;

  const sampleWalletAddress = Wallet.createRandom().address;

  before("Initialize GatewayTS class", function () {
    this.timeout(20_000);

    provider = getDefaultProvider("http://localhost:8545");

    // use the deployer account here as the relayer, as they are guaranteed to be funded by hardhat on localnet startup
    gatekeeper = gatekeeperWallet(provider);

    gateway = new GatewayTs(
      gatekeeper,
      TEST_GATEWAY_TOKEN_ADDRESS.gatewayToken
    ).transaction();
  });

  it("should issue a token", async () => {
    const transaction = await gateway.issue(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    console.log("Transaction:", transaction);

    const txReceipt = await (
      await gatekeeper.sendTransaction(transaction)
    ).wait();

    console.log("TX receipt:", txReceipt);

    const token = await gateway.getToken(
      sampleWalletAddress,
      gatekeeperNetwork
    );

    assert.equal(token.owner, sampleWalletAddress);
    assert.equal(token.state, TokenState.ACTIVE);
  });
});
