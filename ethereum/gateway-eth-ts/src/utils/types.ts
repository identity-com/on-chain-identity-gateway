import { BigNumber } from "ethers";
import { GatewayToken } from "../contracts/typechain-types";

export enum TokenState {
  "ACTIVE",
  "FROZEN",
  "REVOKED",
}

export declare type TokenData = {
  owner: string;
  tokenId: BigNumber;
  state: TokenState;
  expiration: BigNumber;
  bitmask: BigNumber;

  tokenURI?: string;
};

// List of the write operations on the GatewayToken contract that are exposed via this library
export type WriteOps =
  | "createNetwork"
  | "renameNetwork"
  | "addGatekeeper"
  | "removeGatekeeper"
  | "addNetworkAuthority"
  | "removeNetworkAuthority"
  | "mint"
  | "setExpiration"
  | "freeze"
  | "unfreeze"
  | "revoke"
  | "burn"
  | "setBitmask";
export const mappedOpNames = [
  "createNetwork",
  "renameNetwork",
  "addGatekeeper",
  "removeGatekeeper",
  "addNetworkAuthority",
  "removeNetworkAuthority",
  "mint",
  "setExpiration",
  "freeze",
  "unfreeze",
  "revoke",
  "burn",
  "setBitmask",
];

type SubsetMappedWriteOps = Pick<GatewayToken, WriteOps>;

// A GatewayToken contract instance with the write operations converted from their default
// ethers.js return values to the type passed as O
export type MappedWriteOperation<O> = {
  [Property in keyof SubsetMappedWriteOps]: (
    ...args: Parameters<SubsetMappedWriteOps[Property]>
  ) => Promise<O>;
};

// List of the read operations on the GatewayToken contract that are exposed via this library
export type ReadOnlyOps =
  | "getToken"
  | "getNetwork"
  | "verifyToken(address,uint256)"
  | "getTokenIdsByOwnerAndNetwork";
export const readOnlyOpNames = [
  "getToken",
  "getNetwork",
  "verifyToken(address,uint256)",
  "getTokenIdsByOwnerAndNetwork",
];

// A GatewayToken contract instance with the read operations exposed
export type ReadOnlyOperation = Pick<GatewayToken, ReadOnlyOps>;
