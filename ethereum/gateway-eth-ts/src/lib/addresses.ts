export interface ContractAddresses {
    gatewayTokenController: string,
    flagsStorage: string,
    forwarder: string,
}

const MAINNET_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x0',
    flagsStorage: '0x0',
    forwarder: '0x0',
};

const ROPSTEN_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x560691424bCEF5ceF4D5076C8ACA7B38B7b1f9A0',
    flagsStorage: '0xC4ED3F939754f43555932AD2A2Ec1301d0848C07',
    forwarder: '0x79C2bDD404e629828E3702a5f2cdd01FD5De8808',
};

const LOCALHOST_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    flagsStorage: '0x0',
    forwarder: '0x0',
};

export const addresses:{[key: number]: ContractAddresses}  = {
    1: MAINNET_ADDRESSES,
    3: ROPSTEN_ADDRESSES,
    1337: LOCALHOST_ADDRESSES,
};