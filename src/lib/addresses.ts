export interface ContractAddresses {
    gatewayTokenController: string
}

const MAINNET_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x0',
};

const ROPSTEN_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0xD66f3fEaEEB42F230E0E555C1c04632eD1798037',
};

const LOCALHOST_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

export const addresses:{[key: number]: ContractAddresses}  = {
    1: MAINNET_ADDRESSES,
    3: ROPSTEN_ADDRESSES,
    1337: LOCALHOST_ADDRESSES,
};