import { Overrides } from "@ethersproject/contracts";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";

import { getExpirationTime } from "../utils/time";
import {
  MappedWriteOperation,
  ReadOnlyOperation,
  TokenData,
  TokenState,
} from "../utils/types";
import { NULL_CHARGE } from "../utils/charge";
import { NULL_ADDRESS } from "../utils/constants";

/**
 * The main API of the Ethereum Gateway client library.
 * This class expects a contract object, that contains the methods specified in the
 * GatewayToken smart contract, but is agnostic to the return values of those methods.
 *
 * This allows it to be used with a contract object that returns a transaction receipt
 * (i.e. creates, signs and sends the transaction) or a PopulatedTransaction, or others.
 *
 */
export class GatewayTsInternal<
  I extends MappedWriteOperation<O> & ReadOnlyOperation,
  O
> {
  protected gatewayTokenContract: I;
  protected options: Overrides;

  constructor(gatewayTokenContract: I, options?: Overrides) {
    this.gatewayTokenContract = gatewayTokenContract;
    this.options = options;
  }

  private async checkedGetTokenId(
    owner: string,
    network: bigint
  ): Promise<BigNumber> {
    const tokenIds: BigNumber[] =
      await this.gatewayTokenContract.getTokenIdsByOwnerAndNetwork(
        owner,
        network,
        this.options
      );
    // TODO we may want to tolerate this (perhaps with an option
    if (tokenIds.length > 1)
      throw new Error("Multiple tokens found for owner and network");
    if (tokenIds.length === 0)
      throw new Error("No tokens found for owner and network");
    return tokenIds[0];
  }

  createNetwork(
    name: string,
    network: bigint,
    daoGoverned: boolean,
    daoManager?: string
  ): Promise<O> {
    return this.gatewayTokenContract.createNetwork(
      network,
      name,
      daoGoverned,
      daoManager || NULL_ADDRESS,
      this.options
    );
  }

  renameNetwork(name: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.renameNetwork(network, name, this.options);
  }

  addGatekeeper(gatekeeper: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.addGatekeeper(
      gatekeeper,
      network,
      this.options
    );
  }

  removeGatekeeper(gatekeeper: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.removeGatekeeper(
      gatekeeper,
      network,
      this.options
    );
  }

  addNetworkAuthority(authority: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.addNetworkAuthority(
      authority,
      network,
      this.options
    );
  }

  removeNetworkAuthority(authority: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.removeNetworkAuthority(
      authority,
      network,
      this.options
    );
  }

  issue(
    owner: string,
    network: bigint,
    expiry: BigNumberish = 0,
    bitmask: BigNumberish = 0
  ): Promise<O> {
    const expirationTime = expiry > 0 ? getExpirationTime(expiry) : 0;

    return this.gatewayTokenContract.mint(
      owner,
      network,
      expirationTime,
      bitmask,
      NULL_CHARGE,
      this.options
    );
  }

  async revoke(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.revoke(tokenId, this.options);
  }

  async burn(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.burn(tokenId, this.options);
  }

  async freeze(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.freeze(tokenId, this.options);
  }

  async unfreeze(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.unfreeze(tokenId, this.options);
  }

  async refresh(
    owner: string,
    network: bigint,
    expiry?: number | BigNumber
  ): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    const expirationTime = getExpirationTime(expiry);
    return this.gatewayTokenContract.setExpiration(
      tokenId,
      expirationTime,
      NULL_CHARGE,
      this.options
    );
  }

  async setBitmask(
    owner: string,
    network: bigint,
    bitmask: number | BigNumber
  ): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.setBitmask(tokenId, bitmask, this.options);
  }

  verify(owner: string, network: bigint): Promise<boolean> {
    return this.gatewayTokenContract["verifyToken(address,uint256)"](
      owner,
      network
    );
  }

  async getTokenState(
    owner: string,
    network: bigint
  ): Promise<TokenState | null> {
    const [tokenId] = await this.getTokenIdsByOwnerAndNetwork(owner, network);
    if (!tokenId) return null;
    return this.gatewayTokenContract.getTokenState(tokenId);
  }

  async getToken(owner: string, network: bigint): Promise<TokenData | null> {
    const [tokenId] = await this.getTokenIdsByOwnerAndNetwork(owner, network);
    if (!tokenId) return null;

    const rawData = await this.gatewayTokenContract.getToken(tokenId);
    return {
      owner: rawData.owner,
      tokenId,
      bitmask: rawData.bitmask,
      expiration: rawData.expiration,
      state: rawData.state,
    };
  }

  getTokenIdsByOwnerAndNetwork(
    owner: string,
    network: bigint
  ): Promise<BigNumber[]> {
    return this.gatewayTokenContract.getTokenIdsByOwnerAndNetwork(
      owner,
      network,
      this.options
    );
  }
}
