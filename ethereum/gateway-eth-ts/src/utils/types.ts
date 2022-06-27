import { BigNumber} from "ethers";
import {GatewayToken} from "../contracts/typechain-types";


export enum TokenState {
  'ACTIVE',
  'FROZEN',
  'REVOKED',
}


export declare type TokenData = {
  owner: string;
  tokenId: BigNumber | number;
  state: TokenState;
  expiration: BigNumber | number;
  bitmask: BigNumber | number;
};

export type MappedOps = 'addGatekeeper'
  | 'removeGatekeeper'
  | 'addNetworkAuthority'
  | 'removeNetworkAuthority'
  | 'mint'
  | 'setExpiration'
  | 'freeze'
  | 'unfreeze'
  | 'revoke'
  | 'burn'
  | 'setBitmask'
export const mappedOpNames = ['addGatekeeper', 'removeGatekeeper', 'addNetworkAuthority', 'removeNetworkAuthority', 'mint', 'setExpiration', 'freeze', 'unfreeze', 'revoke', 'burn', 'setBitmask'];

type SubsetMappedOps = Pick<GatewayToken, MappedOps>

export type MappedOperation<O> = {
  [Property in keyof SubsetMappedOps]: (...args: Parameters<SubsetMappedOps[Property]>) => Promise<O>
};

export type RawOps = 'getTokenId' | 'getTokenState' | 'getToken' | 'verifyToken(address)';
export const rawOpNames = ['getTokenId', 'getTokenState', 'getToken', 'verifyToken(address)'];

type SubsetRawOps = Pick<GatewayToken, RawOps>
export type RawOperation = {
  [Property in keyof SubsetRawOps]: GatewayToken[Property]
};