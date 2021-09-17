import { addresses, ContractAddresses } from './lib/addresses';
import { gatewayTokenAddresses, GatewayTokenItem } from './lib/gatewaytokens';
import { BigNumber, BytesLike, getDefaultProvider, Signer, utils, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { SUBTRACT_GAS_LIMIT, NETWORKS, } from './utils'
import { GatewayTokenItems } from "./utils/addresses";
import { ethTransaction, TxBase, TxOptions } from "./utils/tx";
import { estimateGasPrice, GasPriceKey } from "./utils/gas";
import { FlagsStorage, GatewayToken, GatewayTokenController } from "./contracts";
import { generateTokenId } from './utils/tokenId';
import { getExpirationTime } from './utils/time';
import { TokenState } from './utils/types';
import { checkTokenState } from './utils/token-state';
import { toBytes32 } from './utils/string';
import { GatewayTsBase } from './GatewayTsBase';

export class GatewayTs extends GatewayTsBase {
  constructor(provider: BaseProvider,  signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
    super(provider, signer, options);

    super.setGasLimit();
  }

  async addGatekeeper(gatekeeper: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    let args: any[] = [gatekeeper];
    
    return ethTransaction(contract, 'addGatekeeper', args, options);
  }

  removeGatekeeper = async (gatekeeper: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> => {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    let args: any[] = [gatekeeper];
    
    return ethTransaction(contract, 'removeGatekeeper', args, options);
  }

  async addNetworkAuthority(authority: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    let args: any[] = [authority];
    
    return ethTransaction(contract, 'addNetworkAuthority', args, options);
  }

  async removeNetworkAuthority (authority: string, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    let args: any[] = [authority];
    
    return ethTransaction(contract, 'removeNetworkAuthority', args, options);
  }

  async issue(owner: string, tokenId: number | BigNumber = null, expiration?: number, bitmask: Uint8Array = Uint8Array.from([0]), gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    if (tokenId === null) {
      tokenId = generateTokenId(owner, bitmask);
    }

    if (expiration != null) {
      let expirationDate = getExpirationTime(expiration);
      let args: any[] = [owner, tokenId, expirationDate];
    
      return ethTransaction(contract, 'mintWithExpiration', args, options);
    } else {
      let args: any[] = [owner, tokenId];
    
      return ethTransaction(contract, 'mint', args, options);
    }
  }

  async revoke(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'revoke', args, options);
  }

  async burn(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'burn', args, options);
  }

  async freeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'freeze', args, options);
  }

  async unfreeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'unfreeze', args, options);
  }

  async refresh(tokenId: number | BigNumber, expiry?: number, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let expirationDate = getExpirationTime(expiry);
    let args: any[] = [tokenId, expirationDate];

    return ethTransaction(contract, 'setExpiration', args, options);
  }

  async blacklist(user: string, options?: TxOptions):Promise<string> {
    const { contract } = this.gatewayTokenController;
    let args: any[] = [user];

    return ethTransaction(contract, 'blacklist', args, options);
  }

  async addFlag(flag: string, index: number | BigNumber, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32 = toBytes32(flag);
    let args: any[] = [bytes32, index];

    return ethTransaction(contract, 'addFlag', args, options);
  }

  async addFlags(flags: string[], indexes: number[] | BigNumber[], options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (let i = 0; i < flags.length; i++) {
      let bytes32 = toBytes32(flags[i]);
      bytes32Array.push(bytes32);
    }
    
    let args: any[] = [bytes32Array, indexes];

    return ethTransaction(contract, 'addFlags', args, options);
  }

  async removeFlag(flag: string, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32 = toBytes32(flag);
    let args: any[] = [bytes32];

    return ethTransaction(contract, 'removeFlag', args, options);
  }

  async removeFlags(flags: string[], options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (let i = 0; i < flags.length; i++) {
      let bytes32 = toBytes32(flags[i]);
      bytes32Array.push(bytes32);
    }
    
    let args: any[] = [bytes32Array];

    return ethTransaction(contract, 'removeFlags', args, options);
  }

  async updateDAOManagerAtFlagsStorage(controller: string, options?: TxOptions):Promise<string> {
    const { contract } = this.flagsStorage;
    let args: any[] = [controller];

    return ethTransaction(contract, 'updateDAOManager', args, options);
  }

  async setBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'setBitmask', args, options);
  }

  async addBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'addBitmask', args, options);
  }

  async addBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, index];

    return ethTransaction(contract, 'addBit', args, options);
  }

  async removeBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, bitmask];

    return ethTransaction(contract, 'removeBitmask', args, options);
  }

  async removeBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, index];

    return ethTransaction(contract, 'removeBit', args, options);
  }

  async removeUnsupportedBits(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'removeUnsupportedBits', args, options);
  }

  async clearBitmask(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId];

    return ethTransaction(contract, 'clearBitmask', args, options);
  }

  async checkAnyHighRiskBits(tokenId: number | BigNumber, highRiskBitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions):Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    let args: any[] = [tokenId, highRiskBitmask];

    return ethTransaction(contract, 'anyHighRiskBits', args, options);
  }
}
