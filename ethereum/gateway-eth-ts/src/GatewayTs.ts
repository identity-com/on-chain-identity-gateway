import { BigNumber, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { ethTransaction, TxOptions } from "./utils/tx";
import { getExpirationTime } from './utils/time';
import { toBytes32 } from './utils/string';
import { GatewayTsBase } from './GatewayTsBase';

export class GatewayTs extends GatewayTsBase {
  constructor(provider: BaseProvider,  signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
    super(provider, signer, options);

    super.setGasLimit();
  }

  async addGatekeeper(gatekeeper: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [gatekeeper];
    
    return ethTransaction(contract, 'addGatekeeper', args, options);
  }

  removeGatekeeper = async (gatekeeper: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> => {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [gatekeeper];
    
    return ethTransaction(contract, 'removeGatekeeper', args, options);
  }

  async addNetworkAuthority(authority: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [authority];
    
    return ethTransaction(contract, 'addNetworkAuthority', args, options);
  }

  async removeNetworkAuthority (authority: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [authority];
    
    return ethTransaction(contract, 'removeNetworkAuthority', args, options);
  }

  async issue(owner: string, tokenId: number | BigNumber = null, expiration: number | BigNumber = 0, bitmask: BigNumber = BigNumber.from('0'), constrains: BigNumber = BigNumber.from('0'), gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);

    if (tokenId === null) {
      tokenId = await this.generateTokenId(owner, constrains, gatewayToken);
    }

    if (expiration > 0) {
      expiration = getExpirationTime(expiration);
    }

    const args: any[] = [owner, tokenId, expiration, bitmask];
    return ethTransaction(gatewayToken.contract, 'mint', args, options);
  }

  async revoke(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'revoke', args, options);
  }

  async burn(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'burn', args, options);
  }

  async freeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'freeze', args, options);
  }

  async unfreeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'unfreeze', args, options);
  }

  async refresh(tokenId: number | BigNumber, expiry?: number, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const expirationDate = getExpirationTime(expiry);
    const args: any[] = [tokenId, expirationDate];

    return ethTransaction(contract, 'setExpiration', args, options);
  }

  async blacklist(user: string, options?: TxOptions):Promise<string> {
    const { contract } = this.gatewayTokenController;
    const args: any[] = [user];

    return ethTransaction(contract, 'blacklist', args, options);
  }

  async addFlag(flag: string, index: number | BigNumber, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    const bytes32 = toBytes32(flag);
    const args: any[] = [bytes32, index];

    return ethTransaction(contract, 'addFlag', args, options);
  }

  async addFlags(flags: string[], indexes: number[] | BigNumber[], options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (let i = 0; i < flags.length; i++) {
      const bytes32 = toBytes32(flags[i]);
      bytes32Array.push(bytes32);
    }
    
    const args: any[] = [bytes32Array, indexes];

    return ethTransaction(contract, 'addFlags', args, options);
  }

  async removeFlag(flag: string, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    const bytes32 = toBytes32(flag);
    const args: any[] = [bytes32];

    return ethTransaction(contract, 'removeFlag', args, options);
  }

  async removeFlags(flags: string[], options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (let i = 0; i < flags.length; i++) {
      const bytes32 = toBytes32(flags[i]);
      bytes32Array.push(bytes32);
    }
    
    const args: any[] = [bytes32Array];

    return ethTransaction(contract, 'removeFlags', args, options);
  }

  async updateDAOManagerAtFlagsStorage(controller: string, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;
    const args: any[] = [controller];

    return ethTransaction(contract, 'updateDAOManager', args, options);
  }

  async setBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'setBitmask', args, options);
  }

  async addBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'addBitmask', args, options);
  }

  async addBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, index];

    return ethTransaction(contract, 'addBit', args, options);
  }

  async removeBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'removeBitmask', args, options);
  }

  async removeBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, index];

    return ethTransaction(contract, 'removeBit', args, options);
  }

  async removeUnsupportedBits(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'removeUnsupportedBits', args, options);
  }

  async clearBitmask(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return ethTransaction(contract, 'clearBitmask', args, options);
  }

  async checkAnyHighRiskBits(tokenId: number | BigNumber, highRiskBitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId, highRiskBitmask];

    return ethTransaction(contract, 'anyHighRiskBits', args, options);
  }
}
