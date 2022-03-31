import { BigNumber, PopulatedTransaction, Wallet } from 'ethers';
import { BaseProvider } from '@ethersproject/providers';

import { ethTransaction, populateTx, TxOptions } from "./utils/tx";
import { getExpirationTime } from './utils/time';
import { toBytes32 } from './utils/string';
import { GatewayTsBase } from './GatewayTsBase';
import { SendableTransaction } from './utils/types';
import { signMetaTxRequest } from './utils/signer';

export class GatewayTs extends GatewayTsBase {
  constructor(
    provider: BaseProvider,
    wallet?: Wallet,
    options?: { defaultGas?: number; defaultGasPrice?: any }
  ) {
    super(provider, wallet, options);

    super.setGasLimit();
  }

  async addGatekeeper(
    gatekeeper: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [gatekeeper];

    return ethTransaction(contract, "addGatekeeper", args, options);
  }

  removeGatekeeper = async (
    gatekeeper: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> => {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [gatekeeper];

    return ethTransaction(contract, "removeGatekeeper", args, options);
  };

  async addNetworkAuthority(
    authority: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [authority];

    return ethTransaction(contract, "addNetworkAuthority", args, options);
  }

  async removeNetworkAuthority(
    authority: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);

    const args: any[] = [authority];

    return ethTransaction(contract, "removeNetworkAuthority", args, options);
  }

  async issue(
    owner: string, 
    tokenId: number | BigNumber = null, 
    expiration: number | BigNumber = 0, 
    bitmask: BigNumber = BigNumber.from('0'), 
    constrains: BigNumber = BigNumber.from('0'), 
    gatewayTokenAddress?: string, 
    options?: TxOptions): Promise<SendableTransaction> {
    
    const gatewayTokenContract = this.getGatewayTokenContract(gatewayTokenAddress);
    const { contract } = gatewayTokenContract;

    if (tokenId === null) {
      tokenId = await this.generateTokenId(owner, constrains, gatewayTokenContract);
    }

    if (expiration > 0) {
      expiration = getExpirationTime(expiration);
    }

    const gatewayTxRequest = await populateTx(contract, 'mint', [owner, tokenId, expiration, bitmask], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);
    return new SendableTransaction(contract, txRequest, options);
  }

  async revoke(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'revoke', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async burn(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'burn', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async freeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'freeze', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async unfreeze(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'unfreeze', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async refresh(tokenId: number | BigNumber, expiry?: number, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const expirationDate = getExpirationTime(expiry);
    const gatewayTxRequest = await populateTx(contract, 'refresh', [tokenId, expirationDate], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async blacklist(user: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.gatewayTokenController;
    const gatewayTxRequest = await populateTx(contract, 'blacklist', [user], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async addFlag(flag: string, index: number | BigNumber, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;
    const bytes32 = toBytes32(flag);
    const gatewayTxRequest = await populateTx(contract, 'addFlag', [bytes32, index], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async addFlags(flags: string[], indexes: number[] | BigNumber[], options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (const flag of flags) {
      const bytes32 = toBytes32(flag);
      bytes32Array.push(bytes32);
    }

    const gatewayTxRequest = await populateTx(contract, 'addFlags', [bytes32Array, indexes], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeFlag(flag: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    const bytes32 = toBytes32(flag);
    const gatewayTxRequest = await populateTx(contract, 'removeFlag', [bytes32], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeFlags(flags: string[], options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (const flag of flags) {
      const bytes32 = toBytes32(flag);
      bytes32Array.push(bytes32);
    }
    
    const gatewayTxRequest = await populateTx(contract, 'removeFlags', [bytes32Array], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async updateDAOManagerAtFlagsStorage(controller: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    const gatewayTxRequest = await populateTx(contract, 'updateDAOManager', [controller], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);
    return new SendableTransaction(contract, txRequest, options);
  }

  async setBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'setBitmask', [tokenId, bitmask], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async addBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'addBitmask', [tokenId, bitmask], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async addBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'addBit', [tokenId, index], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeBitmask(tokenId: number | BigNumber, bitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'removeBitmask', [tokenId, bitmask], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeBit(tokenId: number | BigNumber, index: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'removeBit', [tokenId, index], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeUnsupportedBits(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'removeUnsupportedBits', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async clearBitmask(tokenId: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'clearBitmask', [tokenId], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  async checkAnyHighRiskBits(tokenId: number | BigNumber, highRiskBitmask: number | BigNumber, gatewayTokenAddress?: string, options?: TxOptions): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const gatewayTxRequest = await populateTx(contract, 'anyHighRiskBits', [tokenId, highRiskBitmask], options);
    const txRequest = await this.wrapTxIfForwarded(gatewayTxRequest, contract.address, options);

    return new SendableTransaction(contract, txRequest, options);
  }

  private async wrapTxIfForwarded(tx: PopulatedTransaction, contractAddress: string, options?: TxOptions): Promise<PopulatedTransaction> {
    if (options?.forwardTransaction) {
      const { request, signature } = await signMetaTxRequest(this.wallet, this.forwarder.contract, {
        from: this.wallet.address,
        to: contractAddress,
        data: tx.data
      });

      return populateTx(this.forwarder.contract, 'execute', [request, signature], options);
    }

    return tx;
  }
}
