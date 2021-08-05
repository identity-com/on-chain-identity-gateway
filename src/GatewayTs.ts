import { addresses, ContractAddresses } from './lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from './lib/gatewaytokens';
import { BigNumber, getDefaultProvider, Signer, utils, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { SUBTRACT_GAS_LIMIT, NETWORKS, } from './utils'
import { GatewayTokenItems } from "./utils/addresses";
import { TxBase } from "./utils/tx";
import { estimateGasPrice, GasPriceKey } from "./utils/gas";
import { GatewayToken, GatewayTokenController } from "./contracts";

export class GatewayTs {
    provider: BaseProvider;
    networkId: number;
    blockGasLimit: BigNumber;
    defaultGas: number;
    defaultGasPrice: number;
    network: string;
    signer: Signer;
    gatewayTokenAddresses: string[];
    contractAddresses: ContractAddresses;
    gatewayTokenController: GatewayTokenController;
    gatewayTokens: GatewayTokenItems = {};

    constructor(provider: BaseProvider, networkId: number, signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
        this.defaultGas = options?.defaultGas || 6000000;
        this.defaultGasPrice = options?.defaultGasPrice || 1000000000000;
        this.networkId = networkId || 1;
        this.network = NETWORKS[this.networkId];
        this.contractAddresses = addresses[this.networkId];
        this.signer = signer;

        this.provider = provider || getDefaultProvider();
        if (!provider && networkId) {
          this.provider = getDefaultProvider(this.network);
        }
    
        this.gatewayTokenController = new GatewayTokenController(this.signer || this.provider, addresses[this.networkId].gatewayTokenController);
        gatewayTokenAddresses[this.networkId].map((gatewayToken: GatewayTokenItem) => {
            let tokenAddress = gatewayToken.address
            this.gatewayTokens[tokenAddress] = {
                name : gatewayToken.name,
                symbol: gatewayToken.symbol,
                address: gatewayToken.address,
                tokenInstance: new GatewayToken(this.signer || this.provider, gatewayToken.address),
            }
        });
    }

    async setGasLimit() {
        const block = await this.provider.getBlock('latest')
        this.blockGasLimit = block.gasLimit.sub(BigNumber.from(SUBTRACT_GAS_LIMIT));
    }

    addGatekeeper = async (gatekeeper: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.addGatekeeper(gatekeeper);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.addGatekeeper(gatekeeper, txParams)).wait();

        return tx.transactionHash;
    }

    removeGatekeeper = async (gatekeeper: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.removeGatekeeper(gatekeeper);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.removeGatekeeper(gatekeeper, txParams)).wait();

        return tx.transactionHash;
    }

    addNetworkAuthority = async (authority: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.addNetworkAuthority(authority);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.addNetworkAuthority(authority, txParams)).wait();

        return tx.transactionHash;
    }

    removeNerworkAuthority = async (authority: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.removeNerworkAuthority(authority);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.removeNetworkAuthority(authority, txParams)).wait();

        return tx.transactionHash;
    }

    issue = async (tokenId: number, owner: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.mint(owner, tokenId);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.mint(owner, tokenId, txParams)).wait();

        return tx.transactionHash;
    }

    burn = async (tokenId: number, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.burn(tokenId);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.burn(tokenId, txParams)).wait();

        return tx.transactionHash;
    }

    freeze = async (tokenId: number, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.freeze(tokenId);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.freeze(tokenId, txParams)).wait();

        return tx.transactionHash;
    }

    unfreeze = async (tokenId: number, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.unfreeze(tokenId);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.unfreeze(tokenId, txParams)).wait();

        return tx.transactionHash;
    }

    refresh = async (tokenId: number, expiry: number = 86400 * 14, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await gatewayToken.contract.estimateGas.setExpiration(tokenId, expiry);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await gatewayToken.setExpiration(tokenId, expiry, txParams)).wait();

        return tx.transactionHash;
    }

    verify = async (owner: string, tokenId?: number, gatewayTokenAddress?: string):Promise<boolean> => {
        const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
        let tx: any;

		if (tokenId) {
			tx = await (await gatewayToken.verifyTokenByTokenID(owner, tokenId)).wait();
		} else  {
			tx = await (await gatewayToken.verifyToken(owner)).wait();
		}

        return tx[0];
    }

    blacklist = async (user: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber}):Promise<string> => {
        let controller = this.gatewayTokenController;

        let gasPrice: number | BigNumber;
        let gasLimit: number | BigNumber;

        if (options?.gasPrice == null) {
            gasPrice = await estimateGasPrice();
        } else if (typeof(options?.gasPrice) === "string") {
            gasPrice = await estimateGasPrice(options?.gasPrice);
        }

        if (options?.gasPrice == null) {
            gasLimit = await controller.contract.estimateGas.blacklist(user);
        } else {
            gasLimit = options?.gasLimit;
        }

		let txParams: TxBase = {
			gasLimit: gasLimit,
			gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
		};

		const tx = await(await controller.blacklist(user, txParams)).wait();

        return tx.transactionHash;
    }

    getGatewayTokenContract = (gatewayTokenAddress?: string):GatewayToken => {
        let gatewayToken: GatewayToken;

        if (gatewayTokenAddress) {
            gatewayToken = this.gatewayTokens[gatewayTokenAddress].tokenInstance

            if (gatewayToken == null) {
                gatewayToken = this.defaultGatewayTokenContract();
            }
        } else {
            gatewayToken = this.defaultGatewayTokenContract();
        }

        return gatewayToken
    }

    defaultGatewayTokenContract = ():GatewayToken => {
        let addr = gatewayTokenAddresses[this.networkId][0].address;
        return this.gatewayTokens[addr].tokenInstance
    }
}
