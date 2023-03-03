/* eslint-disable camelcase */
import { Provider } from "@ethersproject/providers";
import {
  GatewayToken,
  GatewayToken__factory,
  IForwarder__factory,
} from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { Wallet } from "ethers";
import { ContractTransaction } from "ethers";
import {
  onGatewayTokenChange,
  removeGatewayTokenChangeListener,
  TokenData,
} from "../utils";
import { GatewayTsTransaction } from "./GatewayTsTransaction";
import { Options } from "../utils/types";

export class GatewayTs extends GatewayTsInternal<
  GatewayToken,
  ContractTransaction
> {
  readonly providerOrWallet: Provider | Wallet;

  constructor(
    // ethers.js requires a Wallet instead of Signer for the _signTypedData function, until v6
    providerOrWallet: Provider | Wallet,
    defaultGatewayToken: string,
    options: Options = {}
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
    const forwarderContract = IForwarder__factory.connect(
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

  public transaction(): GatewayTsTransaction {
    return new GatewayTsTransaction(this.gatewayTokenContract, this.options);
  }

  public onGatewayTokenChange(
    owner: string,
    network: bigint,
    callback: (gatewayToken: TokenData) => void
  ): { unsubscribe: () => void } {
    const subscription = onGatewayTokenChange(owner, network, this, callback);
    return {
      unsubscribe: () => {
        removeGatewayTokenChangeListener(subscription);
      },
    };
  }
}
