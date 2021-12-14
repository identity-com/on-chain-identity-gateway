import { BigNumber } from "@ethersproject/bignumber";

export const NETWORKS: {[key: number]: string} = {
    1: 'mainnet',
    3: 'ropsten',
    1337: 'localhost',
};

export const DEFAULT_CHAIN_ID = 3;
export const DEFAULT_NETWORK = 'ropsten';

export const DEFAULT_GATEWAY_TOKEN = "0xfD745e67635A8c394C5644E676D2B507d60380DF";
export const DEFAULT_MNEMONIC = "test test test test test test test test test test test junk";
export const DEFAULT_GATEWAY_TOKEN_CONTROLLER = "0xE1f4BF0E576f79edf5376A2cC82396E92157AbDC";
export const DEFAULT_FLAGS_STORAGE = "0xB0D4b6A17E71F19f198859Ff6f04a9883bad2E01";

export const DEFAULT_EXPIRATION = 86400 * 14;
export const DEFAULT_EXPIRATION_BN = BigNumber.from(86400).mul(BigNumber.from(14));

export const ZERO_BN = BigNumber.from('0');
export const ONE_BN = BigNumber.from('1');