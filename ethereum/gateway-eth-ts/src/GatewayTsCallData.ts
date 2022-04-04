import { BigNumber, Transaction, Wallet } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

import { signTranaction, TxOptions } from "./utils/tx";
import { getExpirationTime } from "./utils/time";
import { GatewayTsBase } from "./GatewayTsBase";

export class GatewayTsCallData extends GatewayTsBase {
  constructor(
    provider: BaseProvider,
    wallet?: Wallet,
    options?: { defaultGas?: number; defaultGasPrice?: any }
  ) {
    super(provider, wallet, options);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    super.setGasLimit();
  }

  /* eslint-disable max-params */
  async issue(
    owner: string,
    // eslint-disable-next-line default-param-last
    tokenId: number | BigNumber = null,
    // eslint-disable-next-line default-param-last
    expiration: number | BigNumber = 0,
    // eslint-disable-next-line default-param-last
    bitmask: BigNumber = BigNumber.from("0"),
    // eslint-disable-next-line default-param-last
    constrains: BigNumber = BigNumber.from("0"),
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const gatewayToken = this.getGatewayTokenContract(gatewayTokenAddress);
    if (tokenId === null) {
      tokenId = await this.generateTokenId(owner, constrains, gatewayToken);
    }

    if (expiration > 0) {
      expiration = getExpirationTime(expiration);
    }

    const args: any[] = [owner, tokenId, expiration, bitmask];
    return signTranaction(gatewayToken.contract, "mint", args, options);
  }

  async revoke(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return signTranaction(contract, "revoke", args, options);
  }

  async burn(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return signTranaction(contract, "burn", args, options);
  }

  async freeze(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return signTranaction(contract, "freeze", args, options);
  }

  async unfreeze(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const args: any[] = [tokenId];

    return signTranaction(contract, "unfreeze", args, options);
  }

  async refresh(
    tokenId: number | BigNumber,
    expiry?: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<Transaction> {
    const { contract } = this.getGatewayTokenContract(gatewayTokenAddress);
    const expirationDate = getExpirationTime(expiry);
    const args: any[] = [tokenId, expirationDate];

    return signTranaction(contract, "setExpiration", args, options);
  }
}
