/* Autogenerated file. Do not edit manually. */
// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
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

export interface TokenBitMaskInterface extends utils.Interface {
  functions: {
    "flagsStorage()": FunctionFragment;
  };

  getFunction(nameOrSignatureOrTopic: "flagsStorage"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "flagsStorage",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "flagsStorage",
    data: BytesLike
  ): Result;

  events: {
    "BitMaskUpdated(uint256,uint256)": EventFragment;
    "FlagsStorageUpdated(address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "BitMaskUpdated"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FlagsStorageUpdated"): EventFragment;
}

export interface BitMaskUpdatedEventObject {
  tokenId: BigNumber;
  bitmask: BigNumber;
}
export type BitMaskUpdatedEvent = TypedEvent<
  [BigNumber, BigNumber],
  BitMaskUpdatedEventObject
>;

export type BitMaskUpdatedEventFilter = TypedEventFilter<BitMaskUpdatedEvent>;

export interface FlagsStorageUpdatedEventObject {
  flagsStorage: string;
}
export type FlagsStorageUpdatedEvent = TypedEvent<
  [string],
  FlagsStorageUpdatedEventObject
>;

export type FlagsStorageUpdatedEventFilter =
  TypedEventFilter<FlagsStorageUpdatedEvent>;

export interface TokenBitMask extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TokenBitMaskInterface;

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
    flagsStorage(overrides?: CallOverrides): Promise<[string]>;
  };

  flagsStorage(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    flagsStorage(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "BitMaskUpdated(uint256,uint256)"(
      tokenId?: null,
      bitmask?: null
    ): BitMaskUpdatedEventFilter;
    BitMaskUpdated(tokenId?: null, bitmask?: null): BitMaskUpdatedEventFilter;

    "FlagsStorageUpdated(address)"(
      flagsStorage?: PromiseOrValue<string> | null
    ): FlagsStorageUpdatedEventFilter;
    FlagsStorageUpdated(
      flagsStorage?: PromiseOrValue<string> | null
    ): FlagsStorageUpdatedEventFilter;
  };

  estimateGas: {
    flagsStorage(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    flagsStorage(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
