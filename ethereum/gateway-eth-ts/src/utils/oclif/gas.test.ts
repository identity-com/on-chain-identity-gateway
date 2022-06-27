import {
  estimateGasPrice,
  getDefaultOracle,
  DEFAULT_GAS_PRICES,
  GasPrices,
} from "./gas";
import assert = require("assert");
import { should } from "chai";
import { utils } from "ethers/lib/ethers";
import { GasPriceOracle } from "gas-price-oracle";
should();

const parseGwei = (price: string): string => {
  return utils.parseUnits(price, "gwei").toString();
};

describe("Test gas prices oracle", function () {
  let gasOracle: GasPriceOracle;
  let fallbackGasPrices: GasPrices;

  const mainnetNetworkID = 1;
  const ropstenNetworkID = 3;

  it("Try to check mainnet gas prices", async () => {
    fallbackGasPrices = DEFAULT_GAS_PRICES[mainnetNetworkID];
    gasOracle = getDefaultOracle(mainnetNetworkID);

    const gas = await gasOracle.fetchGasPricesOffChain();
    gas.instant.should.be.a("number");
    gas.fast.should.be.a("number");
    gas.standard.should.be.a("number");
    gas.low.should.be.a("number");
  }).timeout(10_000);

  it("Try to check ropsten gas prices", async () => {
    fallbackGasPrices = DEFAULT_GAS_PRICES[ropstenNetworkID];

    let gasPrice = await estimateGasPrice("fast", fallbackGasPrices, { chainId: ropstenNetworkID });
    assert.equal(
      gasPrice.toString(),
      parseGwei(fallbackGasPrices.fast.toString())
    );

    gasPrice = await estimateGasPrice("low", fallbackGasPrices, { chainId: ropstenNetworkID });
    assert.equal(
      gasPrice.toString(),
      parseGwei(fallbackGasPrices.low.toString())
    );

    gasPrice = await estimateGasPrice("standard", fallbackGasPrices, { chainId: ropstenNetworkID });
    assert.equal(
      gasPrice.toString(),
      parseGwei(fallbackGasPrices.standard.toString())
    );

    gasPrice = await estimateGasPrice("instant", fallbackGasPrices, { chainId: ropstenNetworkID });
    assert.equal(
      gasPrice.toString(),
      parseGwei(fallbackGasPrices.instant.toString())
    );
  }).timeout(10_000);
});
