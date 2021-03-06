/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface GatewayTokenControllerInterface extends utils.Interface {
  functions: {
    "acceptTransfersBatch(address[])": FunctionFragment;
    "addNetworkAuthorities(address,address[])": FunctionFragment;
    "blacklist(address)": FunctionFragment;
    "blacklistBatch(address[])": FunctionFragment;
    "createGatekeeperNetwork(string,string,bool,address,address)": FunctionFragment;
    "flagsStorage()": FunctionFragment;
    "identityAdmin()": FunctionFragment;
    "isBlacklisted(address)": FunctionFragment;
    "removeNetworkAuthorities(address,address[])": FunctionFragment;
    "restrictTransfersBatch(address[])": FunctionFragment;
    "transferAdmin(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "acceptTransfersBatch"
      | "addNetworkAuthorities"
      | "blacklist"
      | "blacklistBatch"
      | "createGatekeeperNetwork"
      | "flagsStorage"
      | "identityAdmin"
      | "isBlacklisted"
      | "removeNetworkAuthorities"
      | "restrictTransfersBatch"
      | "transferAdmin"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "acceptTransfersBatch",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "addNetworkAuthorities",
    values: [PromiseOrValue<string>, PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "blacklist",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "blacklistBatch",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "createGatekeeperNetwork",
    values: [
      PromiseOrValue<string>,
      PromiseOrValue<string>,
      PromiseOrValue<boolean>,
      PromiseOrValue<string>,
      PromiseOrValue<string>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "flagsStorage",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "identityAdmin",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "isBlacklisted",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "removeNetworkAuthorities",
    values: [PromiseOrValue<string>, PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "restrictTransfersBatch",
    values: [PromiseOrValue<string>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "transferAdmin",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "acceptTransfersBatch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "addNetworkAuthorities",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "blacklist", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "blacklistBatch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createGatekeeperNetwork",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "flagsStorage",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "identityAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isBlacklisted",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeNetworkAuthorities",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "restrictTransfersBatch",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferAdmin",
    data: BytesLike
  ): Result;

  events: {
    "AdminTransfered(address,address)": EventFragment;
    "Blacklisted(address)": EventFragment;
    "BlacklistedBatch(address[])": EventFragment;
    "FlagsStorageUpdated(address,address)": EventFragment;
    "GatekeeperNetworkCreated(address,string,string,address)": EventFragment;
    "TransfersAcceptedBatch(address[],address)": EventFragment;
    "TransfersRestrictedBatch(address[],address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AdminTransfered"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Blacklisted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "BlacklistedBatch"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FlagsStorageUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "GatekeeperNetworkCreated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TransfersAcceptedBatch"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TransfersRestrictedBatch"): EventFragment;
}

export interface AdminTransferedEventObject {
  previousAdmin: string;
  admin: string;
}
export type AdminTransferedEvent = TypedEvent<
  [string, string],
  AdminTransferedEventObject
>;

export type AdminTransferedEventFilter = TypedEventFilter<AdminTransferedEvent>;

export interface BlacklistedEventObject {
  user: string;
}
export type BlacklistedEvent = TypedEvent<[string], BlacklistedEventObject>;

export type BlacklistedEventFilter = TypedEventFilter<BlacklistedEvent>;

export interface BlacklistedBatchEventObject {
  users: string[];
}
export type BlacklistedBatchEvent = TypedEvent<
  [string[]],
  BlacklistedBatchEventObject
>;

export type BlacklistedBatchEventFilter =
  TypedEventFilter<BlacklistedBatchEvent>;

export interface FlagsStorageUpdatedEventObject {
  previousFlagsStorage: string;
  flagsStorage: string;
}
export type FlagsStorageUpdatedEvent = TypedEvent<
  [string, string],
  FlagsStorageUpdatedEventObject
>;

export type FlagsStorageUpdatedEventFilter =
  TypedEventFilter<FlagsStorageUpdatedEvent>;

export interface GatekeeperNetworkCreatedEventObject {
  tokenAddress: string;
  name: string;
  symbol: string;
  deployer: string;
}
export type GatekeeperNetworkCreatedEvent = TypedEvent<
  [string, string, string, string],
  GatekeeperNetworkCreatedEventObject
>;

export type GatekeeperNetworkCreatedEventFilter =
  TypedEventFilter<GatekeeperNetworkCreatedEvent>;

export interface TransfersAcceptedBatchEventObject {
  tokens: string[];
  account: string;
}
export type TransfersAcceptedBatchEvent = TypedEvent<
  [string[], string],
  TransfersAcceptedBatchEventObject
>;

export type TransfersAcceptedBatchEventFilter =
  TypedEventFilter<TransfersAcceptedBatchEvent>;

export interface TransfersRestrictedBatchEventObject {
  tokens: string[];
  account: string;
}
export type TransfersRestrictedBatchEvent = TypedEvent<
  [string[], string],
  TransfersRestrictedBatchEventObject
>;

export type TransfersRestrictedBatchEventFilter =
  TypedEventFilter<TransfersRestrictedBatchEvent>;

export interface GatewayTokenController extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: GatewayTokenControllerInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    acceptTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    addNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    blacklist(
      user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    blacklistBatch(
      users: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    createGatekeeperNetwork(
      _name: PromiseOrValue<string>,
      _symbol: PromiseOrValue<string>,
      _isDAOGoverned: PromiseOrValue<boolean>,
      _daoExecutor: PromiseOrValue<string>,
      trustedForwarder: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    flagsStorage(overrides?: CallOverrides): Promise<[string]>;

    identityAdmin(overrides?: CallOverrides): Promise<[string]>;

    isBlacklisted(
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    removeNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    restrictTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferAdmin(
      newAdmin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  acceptTransfersBatch(
    tokens: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  addNetworkAuthorities(
    token: PromiseOrValue<string>,
    authorities: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  blacklist(
    user: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  blacklistBatch(
    users: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  createGatekeeperNetwork(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    _isDAOGoverned: PromiseOrValue<boolean>,
    _daoExecutor: PromiseOrValue<string>,
    trustedForwarder: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  flagsStorage(overrides?: CallOverrides): Promise<string>;

  identityAdmin(overrides?: CallOverrides): Promise<string>;

  isBlacklisted(
    user: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  removeNetworkAuthorities(
    token: PromiseOrValue<string>,
    authorities: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  restrictTransfersBatch(
    tokens: PromiseOrValue<string>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferAdmin(
    newAdmin: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    acceptTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    addNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    blacklist(
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    blacklistBatch(
      users: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    createGatekeeperNetwork(
      _name: PromiseOrValue<string>,
      _symbol: PromiseOrValue<string>,
      _isDAOGoverned: PromiseOrValue<boolean>,
      _daoExecutor: PromiseOrValue<string>,
      trustedForwarder: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<string>;

    flagsStorage(overrides?: CallOverrides): Promise<string>;

    identityAdmin(overrides?: CallOverrides): Promise<string>;

    isBlacklisted(
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    removeNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    restrictTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: CallOverrides
    ): Promise<void>;

    transferAdmin(
      newAdmin: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "AdminTransfered(address,address)"(
      previousAdmin?: PromiseOrValue<string> | null,
      admin?: PromiseOrValue<string> | null
    ): AdminTransferedEventFilter;
    AdminTransfered(
      previousAdmin?: PromiseOrValue<string> | null,
      admin?: PromiseOrValue<string> | null
    ): AdminTransferedEventFilter;

    "Blacklisted(address)"(
      user?: PromiseOrValue<string> | null
    ): BlacklistedEventFilter;
    Blacklisted(user?: PromiseOrValue<string> | null): BlacklistedEventFilter;

    "BlacklistedBatch(address[])"(users?: null): BlacklistedBatchEventFilter;
    BlacklistedBatch(users?: null): BlacklistedBatchEventFilter;

    "FlagsStorageUpdated(address,address)"(
      previousFlagsStorage?: PromiseOrValue<string> | null,
      flagsStorage?: PromiseOrValue<string> | null
    ): FlagsStorageUpdatedEventFilter;
    FlagsStorageUpdated(
      previousFlagsStorage?: PromiseOrValue<string> | null,
      flagsStorage?: PromiseOrValue<string> | null
    ): FlagsStorageUpdatedEventFilter;

    "GatekeeperNetworkCreated(address,string,string,address)"(
      tokenAddress?: PromiseOrValue<string> | null,
      name?: null,
      symbol?: null,
      deployer?: null
    ): GatekeeperNetworkCreatedEventFilter;
    GatekeeperNetworkCreated(
      tokenAddress?: PromiseOrValue<string> | null,
      name?: null,
      symbol?: null,
      deployer?: null
    ): GatekeeperNetworkCreatedEventFilter;

    "TransfersAcceptedBatch(address[],address)"(
      tokens?: null,
      account?: null
    ): TransfersAcceptedBatchEventFilter;
    TransfersAcceptedBatch(
      tokens?: null,
      account?: null
    ): TransfersAcceptedBatchEventFilter;

    "TransfersRestrictedBatch(address[],address)"(
      tokens?: null,
      account?: null
    ): TransfersRestrictedBatchEventFilter;
    TransfersRestrictedBatch(
      tokens?: null,
      account?: null
    ): TransfersRestrictedBatchEventFilter;
  };

  estimateGas: {
    acceptTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    addNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    blacklist(
      user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    blacklistBatch(
      users: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    createGatekeeperNetwork(
      _name: PromiseOrValue<string>,
      _symbol: PromiseOrValue<string>,
      _isDAOGoverned: PromiseOrValue<boolean>,
      _daoExecutor: PromiseOrValue<string>,
      trustedForwarder: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    flagsStorage(overrides?: CallOverrides): Promise<BigNumber>;

    identityAdmin(overrides?: CallOverrides): Promise<BigNumber>;

    isBlacklisted(
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    removeNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    restrictTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferAdmin(
      newAdmin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    acceptTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    addNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    blacklist(
      user: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    blacklistBatch(
      users: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    createGatekeeperNetwork(
      _name: PromiseOrValue<string>,
      _symbol: PromiseOrValue<string>,
      _isDAOGoverned: PromiseOrValue<boolean>,
      _daoExecutor: PromiseOrValue<string>,
      trustedForwarder: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    flagsStorage(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    identityAdmin(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isBlacklisted(
      user: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    removeNetworkAuthorities(
      token: PromiseOrValue<string>,
      authorities: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    restrictTransfersBatch(
      tokens: PromiseOrValue<string>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferAdmin(
      newAdmin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
