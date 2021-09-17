import { BigNumber, utils, Wallet } from 'ethers';
import { GasPriceOracle } from 'gas-price-oracle';
import { DEFAULT_CHAIN_ID } from './constants';
import { getProvider } from './providers';
import { mnemonicSigner } from './signer';
import { TxBase } from './tx';

export declare type GasPrices = {
    instant: number,
    fast: number,
    standard: number,
    low: number,
}

export declare type GasPriceOracleOptions = {
    chainId: number,
    defaultRpc: string,
    timeout: number,
    defaultFallbackGasPrices: GasPrices,
}

export declare type GasPriceKey = 'instant' | 'fast' | 'standard' | 'low';

export const DEFAULT_GAS_PRICES: {[key: number]: GasPrices} = {
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
    }
};

const options: GasPriceOracleOptions = {
    chainId: 1,
    defaultRpc: 'https://api.mycryptoapi.com/eth',
    timeout: 10000,
    defaultFallbackGasPrices: DEFAULT_GAS_PRICES[DEFAULT_CHAIN_ID],
};

export const SUBTRACT_GAS_LIMIT = 100000;

export const getDefaultOracle = (chainId: number = 1): GasPriceOracle => {
    options.defaultFallbackGasPrices = DEFAULT_GAS_PRICES[chainId];

    return new GasPriceOracle(options);
}

export const currentGasPrices = async (oracle?: GasPriceOracle, fallbackGasPrices?: GasPrices): Promise<GasPrices> => {
    if (oracle == null) {
        oracle = new GasPriceOracle(options);
    }

    return await oracle.gasPrices(fallbackGasPrices).then((gasPrices: GasPrices): GasPrices => {
        return gasPrices;
    });
}

export const estimateGasPrice = async (priceKey: GasPriceKey = "fast", oracle?: GasPriceOracle, fallbackGasPrices?: GasPrices): Promise<number | BigNumber> => {
    var prices = await currentGasPrices(oracle, fallbackGasPrices);

    if (prices == null) {
        return DEFAULT_GAS_PRICES[DEFAULT_CHAIN_ID][priceKey];
    }
    let gweiPrice = prices[priceKey].toString();
    let weiPrice = utils.parseUnits(gweiPrice, 'gwei');

    return weiPrice;
}

export const estimateGasLimit = async (toAddress: string, value? :number, data? :any, signer?: Wallet): Promise<number | BigNumber> => {
    if (!signer) {
        signer = mnemonicSigner();
        let provider = getProvider();

        signer = signer.connect(provider);
    }

    const tx: TxBase = { 
        to: toAddress,
        value: value ? value: 0,
        data: data ? data: null,
    };

    const gasLimit = await signer.estimateGas(tx);
    return gasLimit;
}