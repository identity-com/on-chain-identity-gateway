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

// List of the write operations on the GatewayToken contract that are exposed via this library 
export type WriteOps = 'addGatekeeper'
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

type SubsetMappedWriteOps = Pick<GatewayToken, WriteOps>

// A GatewayToken contract instance with the write operations converted from their default
// ethers.js return values to the type passed as O
export type MappedWriteOperation<O> = {
  [Property in keyof SubsetMappedWriteOps]: (...args: Parameters<SubsetMappedWriteOps[Property]>) => Promise<O>
};

// List of the read operations on the GatewayToken contract that are exposed via this library
export type ReadOnlyOps = 'getTokenId' | 'getTokenState' | 'getToken' | 'verifyToken(address)';
export const readOnlyOpNames = ['getTokenId', 'getTokenState', 'getToken', 'verifyToken(address)'];

// A GatewayToken contract instance with the read operations exposed
export type ReadOnlyOperation = Pick<GatewayToken, ReadOnlyOps>