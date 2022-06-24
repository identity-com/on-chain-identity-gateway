import { BigNumber, PopulatedTransaction, Signer } from "ethers";
import { Network, Provider } from '@ethersproject/providers';
import { TypedDataSigner } from "@ethersproject/abstract-signer";

import { ethTransaction, populateTx, TxOptions } from "./utils/tx";
import { getExpirationTime } from "./utils/time";
import { toBytes32 } from "./utils/string";
import { GatewayTsBase } from "./GatewayTsBase";
import { SendableTransaction } from "./utils/types";
import { signMetaTxRequest } from "./utils/signer";
import Debug from "debug";
import {Contract} from "ethers/lib/ethers";

// eslint-disable-next-line new-cap
const debug = Debug('gateway-eth-ts:GatewayTs');

export class GatewayTs extends GatewayTsBase {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    providerOrSigner: Provider | Signer,
    network: Network,
    defaultGatewayToken?: string,
    options?: { defaultGas?: number; defaultGasPrice?: any }
  ) {
    super(providerOrSigner, network, defaultGatewayToken, options);
  }

  async addGatekeeper(
    gatekeeper: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract();

    const args: any[] = [gatekeeper];

    return ethTransaction(contract, "addGatekeeper", args, options);
  }

  removeGatekeeper = async (
    gatekeeper: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> => {
    const { contract } = this.getGatewayTokenContract();

    const args: any[] = [gatekeeper];

    return ethTransaction(contract, "removeGatekeeper", args, options);
  };

  async addNetworkAuthority(
    authority: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract();

    const args: any[] = [authority];

    return ethTransaction(contract, "addNetworkAuthority", args, options);
  }

  async removeNetworkAuthority(
    authority: string,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<string> {
    const { contract } = this.getGatewayTokenContract();

    const args: any[] = [authority];

    return ethTransaction(contract, "removeNetworkAuthority", args, options);
  }
  
  private createTransaction = async (
  contract: Contract,
  method: string,
  args: unknown[],
  options?: TxOptions
): Promise<PopulatedTransaction> => {
    return populateTx(contract, method, args, {
      ...options,
      chainId: this.networkId,
    });
  }

  // eslint-disable-next-line max-params
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
  ): Promise<SendableTransaction> {
    const gatewayTokenContract =
      this.getGatewayTokenContract();
    const { contract } = gatewayTokenContract;

    if (tokenId === null) {
      tokenId = await this.generateTokenId(
        owner,
        constrains,
        gatewayTokenContract
      );
    }

    if (expiration > 0) {
      expiration = getExpirationTime(expiration);
    }

    debug("Populating tx");
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "mint",
      [owner, tokenId, expiration, bitmask],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );
    return new SendableTransaction(contract, txRequest, options);
  }

  async revoke(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "revoke",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async burn(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "burn",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async freeze(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "freeze",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async unfreeze(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "unfreeze",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async refresh(
    tokenId: number | BigNumber,
    expiry?: number,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const expirationDate = getExpirationTime(expiry);
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "setExpiration",
      [tokenId, expirationDate],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async blacklist(
    user: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.gatewayTokenController;
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "blacklist",
      [user],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async addFlag(
    flag: string,
    index: number | BigNumber,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;
    const bytes32 = toBytes32(flag);
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "addFlag",
      [bytes32, index],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async addFlags(
    flags: string[],
    indexes: number[] | BigNumber[],
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (const flag of flags) {
      const bytes32 = toBytes32(flag);
      bytes32Array.push(bytes32);
    }

    const gatewayTxRequest = await this.createTransaction(
      contract,
      "addFlags",
      [bytes32Array, indexes],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeFlag(
    flag: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    const bytes32 = toBytes32(flag);
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "removeFlag",
      [bytes32],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeFlags(
    flags: string[],
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    let bytes32Array: string[];

    for (const flag of flags) {
      const bytes32 = toBytes32(flag);
      bytes32Array.push(bytes32);
    }

    const gatewayTxRequest = await this.createTransaction(
      contract,
      "removeFlags",
      [bytes32Array],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async updateDAOManagerAtFlagsStorage(
    controller: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.flagsStorage;

    const gatewayTxRequest = await this.createTransaction(
      contract,
      "updateDAOManager",
      [controller],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );
    return new SendableTransaction(contract, txRequest, options);
  }

  async setBitmask(
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "setBitmask",
      [tokenId, bitmask],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async addBitmask(
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "addBitmask",
      [tokenId, bitmask],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async addBit(
    tokenId: number | BigNumber,
    index: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "addBit",
      [tokenId, index],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeBitmask(
    tokenId: number | BigNumber,
    bitmask: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "removeBitmask",
      [tokenId, bitmask],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeBit(
    tokenId: number | BigNumber,
    index: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "removeBit",
      [tokenId, index],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async removeUnsupportedBits(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "removeUnsupportedBits",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async clearBitmask(
    tokenId: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "clearBitmask",
      [tokenId],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  async checkAnyHighRiskBits(
    tokenId: number | BigNumber,
    highRiskBitmask: number | BigNumber,
    gatewayTokenAddress?: string,
    options?: TxOptions
  ): Promise<SendableTransaction> {
    const { contract } = this.getGatewayTokenContract();
    const gatewayTxRequest = await this.createTransaction(
      contract,
      "anyHighRiskBits",
      [tokenId, highRiskBitmask],
      options
    );
    const txRequest = await this.wrapTxIfForwarded(
      gatewayTxRequest,
      contract.address,
      options
    );

    return new SendableTransaction(contract, txRequest, options);
  }

  private async wrapTxIfForwarded(
    tx: PopulatedTransaction,
    contractAddress: string,
    options?: TxOptions
  ): Promise<PopulatedTransaction> {
    if (options?.forwardTransaction) {
      const signer = this.providerOrSigner as Signer & TypedDataSigner;
      const address = await signer.getAddress();
      const { request, signature } = await signMetaTxRequest(
        signer,
        this.forwarder.contract,
        {
          from: address,
          to: contractAddress,
          data: tx.data,
        }
      );

      return populateTx(
        this.forwarder.contract,
        "execute",
        [request, signature],
        options
      );
    }

    return tx;
  }
}
