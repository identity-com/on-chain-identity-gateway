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

const RINKEBY_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x8769145499e1f97049e0099aF3d14283663C4Cf2',
    flagsStorage: '0xf85d72EF898EbF82Ac1d7597CBb68a4d2898cE46',
    forwarder: '0x2AaA24BaC2a41050dBA2474d6D9C4eaa1cdf9159',
};

const LOCALHOST_ADDRESSES: ContractAddresses = {
    gatewayTokenController: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    flagsStorage: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    forwarder: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

export const addresses:{[key: number]: ContractAddresses}  = {
    1: MAINNET_ADDRESSES,
    3: ROPSTEN_ADDRESSES,
    4: RINKEBY_ADDRESSES,
    1337: LOCALHOST_ADDRESSES,
  31_337: LOCALHOST_ADDRESSES,
};