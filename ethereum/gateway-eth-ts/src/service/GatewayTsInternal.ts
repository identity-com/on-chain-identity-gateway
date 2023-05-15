import { BigNumber, BigNumberish, Overrides } from "ethers";

import { getExpirationTime } from "../utils/time";
import {
  MappedWriteOperation,
  Options,
  ReadOnlyOperation,
  TokenData,
} from "../utils/types";
import { NULL_CHARGE } from "../utils/charge";
import { NULL_ADDRESS } from "../utils/constants";
import { omit } from "ramda";

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
  protected options: Options;

  constructor(gatewayTokenContract: I, options?: Options) {
    this.gatewayTokenContract = gatewayTokenContract;
    this.options = options ?? {};
  }

  private get overrides(): Overrides {
    return omit(["tolerateMultipleTokens"], this.options);
  }

  /**
   * Overrides that are safe to use for read-only operations.
   * Some chains / RPC providers (e.g. Polygon zkEVM) do not allow gasLimit or gasPrice to be set
   * for read-only operations.
   * @private
   */
  private get readOnlyOverrides(): Overrides {
    return omit(["gasLimit", "gasPrice"], this.overrides);
  }

  public async checkedGetTokenId(
    owner: string,
    network: bigint
  ): Promise<BigNumber> {
    const tokenIds: BigNumber[] =
      await this.gatewayTokenContract.getTokenIdsByOwnerAndNetwork(
        owner,
        network,
        this.readOnlyOverrides
      );
    if (tokenIds.length > 1 && !this.options?.tolerateMultipleTokens)
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
      this.overrides
    );
  }

  renameNetwork(name: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.renameNetwork(
      network,
      name,
      this.overrides
    );
  }

  getGatekeeperNetwork(network: bigint): Promise<string> {
    return this.gatewayTokenContract.getNetwork(
      network,
      this.readOnlyOverrides
    );
  }

  listNetworks(
    max: bigint = BigInt(256),
    startAt: bigint = BigInt(0)
  ): Promise<Record<string, bigint>> {
    // Warning - can be inefficient and spam RPCs - use sparings
    const networks: Record<string, bigint> = {};
    const promises = Array.from(
      { length: Number(max) },
      (_, i) => i + Number(startAt)
    ).map(async (i) => {
      const network = (await this.getGatekeeperNetwork(BigInt(i)).catch(
        () => null
      )) as string | null;
      if (network) networks[network] = BigInt(i);
    });

    return Promise.all(promises).then(() => networks);
  }

  addGatekeeper(gatekeeper: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.addGatekeeper(
      gatekeeper,
      network,
      this.overrides
    );
  }

  removeGatekeeper(gatekeeper: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.removeGatekeeper(
      gatekeeper,
      network,
      this.overrides
    );
  }

  addNetworkAuthority(authority: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.addNetworkAuthority(
      authority,
      network,
      this.overrides
    );
  }

  removeNetworkAuthority(authority: string, network: bigint): Promise<O> {
    return this.gatewayTokenContract.removeNetworkAuthority(
      authority,
      network,
      this.overrides
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
      this.overrides
    );
  }

  async revoke(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.revoke(tokenId, this.overrides);
  }

  async burn(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.burn(tokenId, this.overrides);
  }

  async freeze(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.freeze(tokenId, this.overrides);
  }

  async unfreeze(owner: string, network: bigint): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.unfreeze(tokenId, this.overrides);
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
      this.overrides
    );
  }

  async setBitmask(
    owner: string,
    network: bigint,
    bitmask: number | BigNumber
  ): Promise<O> {
    const tokenId = await this.checkedGetTokenId(owner, network);
    return this.gatewayTokenContract.setBitmask(
      tokenId,
      bitmask,
      this.overrides
    );
  }

  verify(owner: string, network: bigint): Promise<boolean> {
    return this.gatewayTokenContract["verifyToken(address,uint256)"](
      owner,
      network,
      this.readOnlyOverrides
    );
  }

  async getToken(owner: string, network: bigint): Promise<TokenData | null> {
    const [tokenId] = await this.getTokenIdsByOwnerAndNetwork(owner, network);
    if (!tokenId) return null;

    const rawData = await this.gatewayTokenContract.getToken(
      tokenId,
      this.readOnlyOverrides
    );
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
      this.readOnlyOverrides
    );
  }
}
