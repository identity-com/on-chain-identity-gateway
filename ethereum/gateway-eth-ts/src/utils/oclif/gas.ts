import {BigNumber, utils} from "ethers";
import {GasPriceOracle} from "gas-price-oracle";

export declare type GasPrices = {
  instant: number;
  fast: number;
  standard: number;
  low: number;
};

export declare type GasPriceOracleOptions = {
  chainId: number;
  defaultRpc: string;
  timeout: number;
};

export declare type GasPriceKey = "instant" | "fast" | "standard" | "low";

export const DEFAULT_GAS_PRICES: { [key: number]: GasPrices } = {
  1: {
    instant: 23,
    fast: 17,
    standard: 13,
    low: 9,
  },
  3: {
    instant: 10,
    fast: 5,
    standard: 3,
    low: 1,
  },
  1337: {
    instant: 1,
    fast: 1,
    standard: 1,
    low: 1,
  },
  31_337: {
    instant: 1,
    fast: 1,
    standard: 1,
    low: 1,
  },
};

const options: GasPriceOracleOptions = {
  chainId: 1,
  defaultRpc: "https://api.mycryptoapi.com/eth",
  timeout: 10_000,
};

export const getDefaultOracle = (chainId = 1): GasPriceOracle => {
  options.chainId = chainId;

  return new GasPriceOracle({
    defaultFallbackGasPrices: DEFAULT_GAS_PRICES[chainId],
    chainId
  });
};

export const currentGasPrices = async (
  fallbackGasPrices?: GasPrices,
  oracleOptions: Partial<GasPriceOracleOptions> = {},
): Promise<GasPrices> => {
  const oracle = new GasPriceOracle({
    ...options,
    ...oracleOptions
  });

  return oracle
    .gasPrices(fallbackGasPrices)
    .then((gasPrices: GasPrices): GasPrices => {
      return gasPrices;
    });
};

export const estimateGasPrice = async (
  priceKey: GasPriceKey,
  fallbackGasPrices?: GasPrices,
  oracleOptions: Partial<GasPriceOracleOptions> = {},
): Promise<number | BigNumber> => {
  const prices = await currentGasPrices(fallbackGasPrices, oracleOptions);
  const gweiPrice = prices[priceKey].toString();
  return utils.parseUnits(gweiPrice, "gwei");
};
