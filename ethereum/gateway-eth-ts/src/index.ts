import { GatewayTs } from "./GatewayTs";
import { Signer, utils } from "ethers";
import { Network } from "@ethersproject/providers";
export { GasPriceKey } from "./utils/gas";
export { TokenData, SendableTransaction, SentTransaction } from "./utils/types";
export { DEFAULT_GATEWAY_TOKEN } from "./utils/constants";
export { GatewayTsCallData } from './GatewayTsCallData';

export class GatewayETH extends GatewayTs {
  utils: any;

  /**
   * Creates an instance for accessing the gateway token system on Ethereum.
   * Usage example:
   * const {GatewayETH} = require('GatewayTS');
   * const gatewayTs = new GatewayETH();
   * @constructor
   * @param signer {Ethers signer, gets default provider if there is no signer provided}
   * @param network {Ethers network class}
   * @param defaultGatewayToken {Address of default gateway token contract}
   * @param options {Gas, gasPrice}
   * @notice utils {Ethers utils}
   */
  constructor(
    signer: Signer,
    network: Network,
    defaultGatewayToken?: string,
    options?: { defaultGas?: number; defaultGasPrice?: any }
  ) {
    super(signer, network, defaultGatewayToken, options);
    this.utils = utils;
  }
}
