import { addresses, ContractAddresses } from './lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from './lib/gatewaytokens';
import { BigNumber, BytesLike, getDefaultProvider, Signer, utils, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { SUBTRACT_GAS_LIMIT, NETWORKS, } from './utils'
import { GatewayTokenItems } from "./utils/addresses";
import { TxBase } from "./utils/tx";
import { estimateGasPrice, GasPriceKey } from "./utils/gas";
import { GatewayToken, GatewayTokenController } from "./contracts";
import { generateTokenId } from './utils/tokenId';

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

  defaultGatewayToken: string;

  constructor(provider: BaseProvider,  signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
    this.defaultGas = options?.defaultGas || 6000000;
    this.defaultGasPrice = options?.defaultGasPrice || 1000000000000;

    this.signer = signer;

    this.provider = provider || getDefaultProvider();
  }

  async init(defaultGatewayToken?: string) {
    const network = await this.provider.getNetwork();

    this.networkId = network.chainId;
    this.network = NETWORKS[this.networkId];
    this.contractAddresses = addresses[this.networkId];

    this.gatewayTokenController = new GatewayTokenController(this.signer || this.provider, addresses[this.networkId].gatewayTokenController);
    gatewayTokenAddresses[this.networkId].forEach((gatewayToken: GatewayTokenItem) => {
      const tokenAddress = gatewayToken.address
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

  async addGatekeeper(gatekeeper: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.addGatekeeper(gatekeeper);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;
    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.addGatekeeper(gatekeeper, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.addGatekeeper(gatekeeper, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  removeGatekeeper = async (gatekeeper: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> => {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.removeGatekeeper(gatekeeper);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;
    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.removeGatekeeper(gatekeeper, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.removeGatekeeper(gatekeeper, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async addNetworkAuthority(authority: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.addNetworkAuthority(authority);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.addNetworkAuthority(authority, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.addNetworkAuthority(authority, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async removeNetworkAuthority (authority: string, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.removeNerworkAuthority(authority);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;
    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.removeNetworkAuthority(authority, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.removeNetworkAuthority(authority, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async issue(owner: string, tokenId: number | BigNumber = null, expiration?: number, bitmask: Uint8Array = Uint8Array.from([0]), gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (tokenId === null) {
      tokenId = generateTokenId(owner, bitmask);
    }

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.mint(owner, tokenId);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;
    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.mint(owner, tokenId, expiration, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.mint(owner, tokenId, expiration, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async burn(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.burn(tokenId);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.burn(tokenId, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.burn(tokenId, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async freeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.freeze(tokenId);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.freeze(tokenId, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.freeze(tokenId, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async unfreeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.unfreeze(tokenId);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.unfreeze(tokenId, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.unfreeze(tokenId, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async refresh(tokenId: number | BigNumber, expiry: number = 86400 * 14, gatewayTokenAddress?: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await gatewayToken.contract.estimateGas.setExpiration(tokenId, expiry);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await gatewayToken.setExpiration(tokenId, expiry, txParams)).wait(options.confirmations);
    } else {
      tx = await gatewayToken.setExpiration(tokenId, expiry, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  async verify(owner: string, tokenId?: number, gatewayTokenAddress?: string):Promise<boolean> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    let result: any;

    if (tokenId) {
      result = await gatewayToken.verifyTokenByTokenID(owner, tokenId);
    } else {
      result = await gatewayToken.verifyToken(owner);
    }

    return result[0];
  }

  async generateTokenId(address: string, constrains: BytesLike): Promise<BigNumber> {
    return generateTokenId(address, constrains);
  }

  async getDefaultTokenId(owner: string, gatewayTokenAddress?: string):Promise<number | BigNumber> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    let tokenId: number | BigNumber;

    tokenId = await gatewayToken.getTokenId(owner);

    return tokenId;
  }

  async getTokenState(tokenId?: number, gatewayTokenAddress?: string):Promise<boolean> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    let tx: any;

    tx = await gatewayToken.getToken(tokenId);

    return tx;
  }

  async blacklist(user: string, options?: {gasPrice: number | BigNumber | GasPriceKey, gasLimit: number | BigNumber, confirmations: number}):Promise<string> {
    const controller = this.gatewayTokenController;

    let gasPrice: number | BigNumber;
    let gasLimit: number | BigNumber;

    if (options?.gasPrice === null) {
      gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
      gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasPrice === null) {
      gasLimit = await controller.contract.estimateGas.blacklist(user);
    } else {
      gasLimit = options?.gasLimit;
    }

    const txParams: TxBase = {
      gasLimit: gasLimit,
      gasPrice: BigNumber.from(utils.parseUnits(String(gasPrice), 'gwei') ),
    };

    let tx: any;

    if (options?.confirmations !== null && options?.confirmations > 0) {
      tx = await(await controller.blacklist(user, txParams)).wait(options.confirmations);
    } else {
      tx = await controller.blacklist(user, txParams);
    }

    return (options?.confirmations !== null && options?.confirmations > 0) ? tx.transactionHash : tx.hash;
  }

  getGatewayTokenContract(gatewayTokenAddress?: string):GatewayToken {
    let gatewayToken: GatewayToken;

    if (gatewayTokenAddress) {
      gatewayToken = this.gatewayTokens[gatewayTokenAddress].tokenInstance

      if (gatewayToken === null) {
        gatewayToken = this.defaultGatewayTokenContract();
      }
    } else {
      gatewayToken = this.defaultGatewayTokenContract();
    }

    return gatewayToken
  }

  defaultGatewayTokenContract():GatewayToken {
    if (this.defaultGatewayToken != null) {
      return this.gatewayTokens[this.defaultGatewayToken].tokenInstance
    }

    const addr = gatewayTokenAddresses[this.networkId][0].address;
    return this.gatewayTokens[addr].tokenInstance
  }
}
