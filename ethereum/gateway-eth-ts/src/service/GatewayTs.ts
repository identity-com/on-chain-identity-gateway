/* eslint-disable camelcase */
import { Provider } from "@ethersproject/providers";
import {
  Forwarder__factory,
  GatewayToken,
  GatewayToken__factory,
} from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import { GatewayTsForwarder } from "./GatewayTsForwarder";
import { Wallet } from "ethers";
import { ContractTransaction, Overrides } from "ethers";
import {
  onGatewayTokenChange,
  removeGatewayTokenChangeListener,
  TokenData,
} from "../utils";
import { asProvider } from "../utils/provider";
import { GatewayTsTransaction } from "./GatewayTsTransaction";

export class GatewayTs extends GatewayTsInternal<
  GatewayToken,
  ContractTransaction
> {
  readonly providerOrWallet: Provider | Wallet;

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
