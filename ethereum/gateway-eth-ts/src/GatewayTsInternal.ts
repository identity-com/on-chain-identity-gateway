import {BigNumber, Overrides} from "ethers";

import { getExpirationTime } from "./utils/time";
import {ZERO_BN} from "./utils/constants";
import {generateId} from "./utils/tokenId";
import {MappedOperation, RawOperation, TokenData, TokenState} from "./utils/types";

export class GatewayTsInternal<I extends MappedOperation<O> & RawOperation, O> {
  protected gatewayTokenContract: I;
  protected options: Overrides;

  constructor(
    gatewayTokenContract: I,
    options?: Overrides
  ) {
    this.gatewayTokenContract = gatewayTokenContract;
    this.options = options;
  }

  addGatekeeper(
    gatekeeper: string,
  ): Promise<O> {
    return this.gatewayTokenContract.addGatekeeper(gatekeeper);
  }

  removeGatekeeper(
    gatekeeper: string,
  ): Promise<O> {
    return this.gatewayTokenContract.removeGatekeeper(gatekeeper);
  };

  addNetworkAuthority(
    authority: string,
  ): Promise<O> {
    return this.gatewayTokenContract.addNetworkAuthority(authority);
  }

  removeNetworkAuthority(
    authority: string,
  ): Promise<O> {
    return this.gatewayTokenContract.removeNetworkAuthority(authority);
  }

  generateTokenId(
    address: string,
    constraints?: BigNumber,
  ): BigNumber {
    const constraintsWithDefault = constraints || ZERO_BN;

    return generateId(address, constraintsWithDefault);
  }

  getTokenId(
    owner: string,
  ): Promise<BigNumber> {
    return this.gatewayTokenContract.getTokenId(owner);
  }

  issue(
    owner: string,
    tokenId: number | BigNumber = null,
    expiration: number | BigNumber = 0,
    bitmask: BigNumber = ZERO_BN,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    const expirationTime = expiration > 0 ? getExpirationTime(expiration) : 0;

    return this.gatewayTokenContract.mint(owner, mintTokenId, expirationTime, bitmask);
  }

  revoke(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.revoke(mintTokenId);
  }

  burn(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.burn(mintTokenId);
  }

  freeze(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.freeze(mintTokenId);
  }

  unfreeze(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.unfreeze(mintTokenId);
  }

  refresh(
    owner: string,
    tokenId?: number | BigNumber,
    expiry?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    const expirationTime = getExpirationTime(expiry);
    return this.gatewayTokenContract.setExpiration(mintTokenId, expirationTime);
  }

  setBitmask(
    owner: string,
    bitmask: number | BigNumber,
    tokenId?: number | BigNumber,
  ): Promise<O> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.setBitmask(mintTokenId, bitmask);
  }
  
  verify(owner: string): Promise<boolean> {
    return this.gatewayTokenContract["verifyToken(address)"](owner);
  }

  getTokenState(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<TokenState> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    return this.gatewayTokenContract.getTokenState(mintTokenId);
  }
  
  async getToken(
    owner: string,
    tokenId?: number | BigNumber,
  ): Promise<TokenData> {
    const mintTokenId = tokenId || this.generateTokenId(owner);
    const rawData = await this.gatewayTokenContract.getToken(mintTokenId);
    return {
      owner: rawData.owner,
      tokenId: mintTokenId,
      bitmask: rawData.bitmask,
      expiration: rawData.expiration,
      state: rawData.state,
    }
  }
}
