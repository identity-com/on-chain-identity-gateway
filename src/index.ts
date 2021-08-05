import { GatewayTs } from './GatewayTs';
import { utils, Wallet } from 'ethers';
export { run } from "@oclif/command";
import { BaseProvider } from '@ethersproject/providers';

export class GatewayETH extends GatewayTs {
  utils: any;
  /**
   * Creates an instance for accessing the gateway token system on Ethereum.
   * Usage example:
   * const {GatewayETH} = require('GatewayTS');
   * const gatewayTs = new GatewayETH();
   * @constructor
   * @param provider {Ethers provider, default on mainnet}
   * @param networkId {Network ID}
   * @notice utils {Ethers utils}
   */
  constructor(provider: BaseProvider, networkId: number, signer?: Wallet, options?: { defaultGas?: number; defaultGasPrice?: any; }) {
    super(provider, networkId, signer, options);
    this.utils = utils;
  }
}
