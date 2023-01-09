/* eslint-disable camelcase */
import { Network, Provider } from "@ethersproject/providers";
import {
  Forwarder__factory,
  GatewayToken,
  GatewayToken__factory,
} from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { Wallet } from "@ethersproject/wallet";
import { ContractTransaction, Overrides } from "@ethersproject/contracts";

export class GatewayTs extends GatewayTsInternal<
  GatewayToken,
  ContractTransaction
> {
  private providerOrWallet: Provider | Wallet;

  constructor(
    // ethers.js requires a Wallet instead of Signer for the _signTypedData function, until v6
    providerOrWallet: Provider | Wallet,
    defaultGatewayToken: string,
    options: Overrides = {}
  ) {
    const gatewayTokenContract = GatewayToken__factory.connect(
      defaultGatewayToken,
      providerOrWallet
    );
    super(gatewayTokenContract, options);

    this.gatewayTokenContract = gatewayTokenContract;
    this.providerOrWallet = providerOrWallet;
  }

  public forward(forwarderAddress: string): GatewayTsForwarder {
    const forwarderContract = Forwarder__factory.connect(
      forwarderAddress,
      this.providerOrWallet
    );
    return new GatewayTsForwarder(
      this.providerOrWallet,
      this.gatewayTokenContract,
      forwarderContract,
      this.options
    );
  }
}
