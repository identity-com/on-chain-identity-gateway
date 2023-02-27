import {GasPriceOracle, GetTxGasParamsRes, FallbackGasPrices, GasOracleOptions} from 'gas-price-oracle'

export declare type GasPriceKey = 'instant' | 'fast' | 'standard' | 'low';

export const DEFAULT_GAS_PRICES: { [key: number]: FallbackGasPrices } = {
  1: {gasPrices: {
    instant: 23,
    fast: 17,
    standard: 13,
    low: 9,
  }},
  3: {gasPrices: {
    instant: 10,
    fast: 5,
    standard: 3,
    low: 1,
  }},
  1337: {gasPrices: {
    instant: 1,
    fast: 1,
    standard: 1,
    low: 1,
  }},
  31_337: {gasPrices: {
    instant: 1,
    fast: 1,
    standard: 1,
    low: 1,
  }},
}

const options: GasOracleOptions = {
  chainId: 1,
  // defaultRpc: 'https://api.mycryptoapi.com/eth',
  timeout: 10_000,
  shouldCache: true,
}

export const estimateGasPrice = async (
  priceKey?: GasPriceKey,
  oracleOptions: Partial<GasOracleOptions> = {},
): Promise<GetTxGasParamsRes> => {
  const oracle = new GasPriceOracle({
    fallbackGasPrices: DEFAULT_GAS_PRICES[oracleOptions.chainId || 1],
    ...options,
    ...oracleOptions,
  })

  const payload = priceKey ? {legacySpeed: priceKey} : {isLegacy: false}
  const txGasParams = await oracle.getTxGasParams(payload)

  console.log('Result from Gas Price Oracle', txGasParams)

  return txGasParams
}
