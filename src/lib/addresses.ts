export interface ContractAddresses {
    gatewayTokenController: string,
    flagsStorage: string,
}

const MAINNET_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x0',
    flagsStorage: '0x0',
};

const ROPSTEN_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0xE1f4BF0E576f79edf5376A2cC82396E92157AbDC',
    flagsStorage: '0xB0D4b6A17E71F19f198859Ff6f04a9883bad2E01',
};

const LOCALHOST_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    flagsStorage: '0x0',
};

export const addresses:{[key: number]: ContractAddresses}  = {
    1: MAINNET_ADDRESSES,
    3: ROPSTEN_ADDRESSES,
    1337: LOCALHOST_ADDRESSES,
};