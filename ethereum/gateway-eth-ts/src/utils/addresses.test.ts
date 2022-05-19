import { addresses } from "../lib/addresses";
import {
  getGatewayControllerByNetworkID,
  getFlagsStorageByNetworkID,
  getGatewayTokenByName,
  getGatewayTokenBySymbol,
  getGatewayTokenByAddress,
} from "./addresses";
import assert = require("assert");
import { gatewayTokenAddresses, GatewayTokenItem } from "../lib/gatewaytokens";

describe("Check contract addresses", function () {
  const mainnetNetworkID = 1;
  const ropstenNetworkID = 3;
  const localhostNetworkID = 1337;

  const gatewayTokenName = "Test Gateway Token";
  const localhostTokenName = "Test-KYC";
  const gatewayTokenSymbol = "tKYC";

  it("Try to check mainnet addresses", function () {
    let address: string = getGatewayControllerByNetworkID(mainnetNetworkID);
    assert.equal(address, addresses[mainnetNetworkID].gatewayTokenController);

    address = getFlagsStorageByNetworkID(mainnetNetworkID);
    assert.equal(address, addresses[mainnetNetworkID].flagsStorage);
  });

  it("Try to check ropsten addresses", function () {
    let address: string = getGatewayControllerByNetworkID(ropstenNetworkID);
    assert.equal(address, addresses[ropstenNetworkID].gatewayTokenController);

    address = getFlagsStorageByNetworkID(ropstenNetworkID);
    assert.equal(address, addresses[ropstenNetworkID].flagsStorage);
  });

  it("Try to check localhost addresses", function () {
    let address: string = getGatewayControllerByNetworkID(localhostNetworkID);
    assert.equal(address, addresses[localhostNetworkID].gatewayTokenController);

    address = getFlagsStorageByNetworkID(localhostNetworkID);
    assert.equal(address, addresses[localhostNetworkID].flagsStorage);
  });

  it("Should return correct mainnet gateway token address by name, symbol and address", function () {
    const actualAddress = gatewayTokenAddresses[mainnetNetworkID][0].address;

    let token: GatewayTokenItem = getGatewayTokenByName(
      gatewayTokenName,
      mainnetNetworkID
    );
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenBySymbol(gatewayTokenSymbol, mainnetNetworkID);
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenByAddress("0x0", mainnetNetworkID);
    assert.equal(token.address, "0x0");
  });

  it("Should return correct ropsten gateway token address by name, symbol and address", function () {
    const actualAddress = gatewayTokenAddresses[ropstenNetworkID][0].address;

    let token: GatewayTokenItem = getGatewayTokenByName(
      gatewayTokenName,
      ropstenNetworkID
    );
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenBySymbol(gatewayTokenSymbol, ropstenNetworkID);
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenByAddress(actualAddress, ropstenNetworkID);
    assert.equal(token.address, actualAddress);
  });

  it("Should return correct localhost gateway token address by name, symbol and address", function () {
    const actualAddress = gatewayTokenAddresses[localhostNetworkID][0].address;

    let token: GatewayTokenItem = getGatewayTokenByName(
      localhostTokenName,
      localhostNetworkID
    );
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenBySymbol(gatewayTokenSymbol, localhostNetworkID);
    assert.equal(token.address, actualAddress);

    token = getGatewayTokenByAddress(actualAddress, localhostNetworkID);
    assert.equal(token.address, actualAddress);
  });

  it("Expect error on get addresses for non-existing network", function () {
    assert.throws(() => {
      getGatewayControllerByNetworkID(2);
    }, Error);
    assert.throws(() => {
      getFlagsStorageByNetworkID(2);
    }, Error);
    assert.throws(() => {
      getGatewayTokenByName(gatewayTokenName, 2);
    }, Error);
    assert.throws(() => {
      getGatewayTokenBySymbol(gatewayTokenSymbol, 2);
    }, Error);
    assert.throws(() => {
      getGatewayTokenByAddress("", 2);
    }, Error);
  });
});
