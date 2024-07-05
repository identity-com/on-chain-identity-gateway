/* eslint-disable camelcase */
import { ContractTransactionResponse, Provider, Signer } from "ethers";
import {
  GatewayToken,
  GatewayToken__factory,
  IForwarder__factory,
} from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import { ForwarderOptions, GatewayTsForwarder } from "./GatewayTsForwarder";
import {
  onGatewayTokenChange,
  removeGatewayTokenChangeListener,
  TokenData,
} from "../utils";
import { GatewayTsTransaction } from "./GatewayTsTransaction";
import { Options } from "../utils/types";

export class GatewayTs extends GatewayTsInternal<
  GatewayToken,
  ContractTransactionResponse
> {
  readonly providerOrSigner: Provider | Signer;

  constructor(
    providerOrSigner: Provider | Signer,
    defaultGatewayToken: string,
    options: Options = {}
  ) {
    const gatewayTokenContract = GatewayToken__factory.connect(
      defaultGatewayToken,
      providerOrSigner
    );
    super(gatewayTokenContract, options);

    this.gatewayTokenContract = gatewayTokenContract;
    this.providerOrSigner = providerOrSigner;
  }

  private get forwarderOptions(): ForwarderOptions {
    const gasLimit = this.options.gasLimit;
    if (gasLimit && typeof gasLimit !== "number") {
      throw new Error("gasLimit must be a number to use the forwarder");
    }
    return this.options as ForwarderOptions;
  }

  public forward(forwarderAddress: string): GatewayTsForwarder {
    const forwarderContract = IForwarder__factory.connect(
      forwarderAddress,
      this.providerOrSigner
    );

    return new GatewayTsForwarder(
      this.providerOrSigner,
      this.gatewayTokenContract,
      forwarderContract,
      this.forwarderOptions
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
