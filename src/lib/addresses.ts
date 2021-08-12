export interface ContractAddresses {
    gatewayTokenController: string
}

const MAINNET_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x0',
};

const ROPSTEN_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x7b97B03C3232a6560d6C9daAaE49f33037D9131C',
};

const LOCALHOST_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

export const addresses:{[key: number]: ContractAddresses}  = {
    1: MAINNET_ADDRESSES,
    3: ROPSTEN_ADDRESSES,
    1337: LOCALHOST_ADDRESSES,
};