import { GatewayTs } from './GatewayTs';
import { utils } from 'ethers';
export { run } from "@oclif/command";

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
  constructor(provider: any, networkId: number, options: { defaultGas: number; defaultGasPrice: any; }) {
    super(provider, networkId, options);
    this.utils = utils;
  }
}
