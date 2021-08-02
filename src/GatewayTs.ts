import abis from "./lib/abis";
import { addresses, ContractAddresses } from './lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from './lib/gatewaytokens';
import { Contract, getDefaultProvider, Signer } from 'ethers';

import { SUBTRACT_GAS_LIMIT, NETWORKS, } from './utils'
import { getGatewayTokenByAddress } from "./utils/addresses";

export class GatewayTs {
    provider: any;
    networkId: number;
    blockGasLimit: number;
    defaultGas: number;
    defaultGasPrice: number;
    network: string;
    signer: Signer;
    gatewayTokenAddresses: string[];
    contractAddresses: ContractAddresses;
    gatewayTokenController: Contract;
    gatewayTokens: any[];

    constructor(provider: any, networkId: number, options: { defaultGas: number; defaultGasPrice: any; }) {
        this.defaultGas = options.defaultGas;
        this.defaultGasPrice = options.defaultGasPrice;
        this.networkId = networkId || 1;
        this.network = NETWORKS[this.networkId];
        this.contractAddresses = addresses[this.networkId];

        this.provider = provider || getDefaultProvider();
        if (!provider && networkId) {
          this.provider = getDefaultProvider(this.network);
        }
    
        this.gatewayTokenController = new Contract(addresses[this.networkId].gatewayTokenController, abis.GatewayTokenController, this.signer);
        this.gatewayTokens = gatewayTokenAddresses[this.networkId].map((gatewayToken: GatewayTokenItem) => {
            return {
                name : gatewayToken.name,
                symbol: gatewayToken.symbol,
                address: gatewayToken.address,
                contract: new Contract(gatewayToken.name, abis.GatewayToken, this.signer),
            }
        });

        this.setProvider(provider, networkId);
    }

    setProvider(provider: any, networkId: any) {
        const setProvider = (contract: Contract, address: string) => {
            contract.setProvider(provider)
            if (address) contract.options.address = address
            else console.error('Contract address not found in network', networkId)
        }

        setProvider(this.gatewayTokenController, addresses[this.networkId].gatewayTokenController)

        this.gatewayTokens.forEach((gatewayToken) => {
            setProvider(gatewayToken.contract, gatewayToken.address)
        })
    }

    async setGasLimit() {
        const block = await this.provider.getBlock('latest')
        this.blockGasLimit = block.gasLimit - SUBTRACT_GAS_LIMIT
    }

    // TODO: add generally used function on gatewayTs level
}
