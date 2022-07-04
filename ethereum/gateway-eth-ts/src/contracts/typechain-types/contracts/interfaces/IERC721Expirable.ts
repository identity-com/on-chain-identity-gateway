/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
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
} from "../../common";

export interface IERC721ExpirableInterface extends utils.Interface {
  functions: {
    "expiration(uint256)": FunctionFragment;
    "setExpiration(uint256,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "expiration" | "setExpiration"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "expiration",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "setExpiration",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;

  decodeFunctionResult(functionFragment: "expiration", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "setExpiration",
    data: BytesLike
  ): Result;

  events: {
    "Expiration(uint256,uint256)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Expiration"): EventFragment;
}

export interface ExpirationEventObject {
  tokenId: BigNumber;
  timestamp: BigNumber;
}
export type ExpirationEvent = TypedEvent<
  [BigNumber, BigNumber],
  ExpirationEventObject
>;

export type ExpirationEventFilter = TypedEventFilter<ExpirationEvent>;

export interface IERC721Expirable extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IERC721ExpirableInterface;

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
    expiration(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    setExpiration(
      tokenId: PromiseOrValue<BigNumberish>,
      timestamp: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  expiration(
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setExpiration(
    tokenId: PromiseOrValue<BigNumberish>,
    timestamp: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    expiration(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setExpiration(
      tokenId: PromiseOrValue<BigNumberish>,
      timestamp: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Expiration(uint256,uint256)"(
      tokenId?: PromiseOrValue<BigNumberish> | null,
      timestamp?: null
    ): ExpirationEventFilter;
    Expiration(
      tokenId?: PromiseOrValue<BigNumberish> | null,
      timestamp?: null
    ): ExpirationEventFilter;
  };

  estimateGas: {
    expiration(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setExpiration(
      tokenId: PromiseOrValue<BigNumberish>,
      timestamp: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    expiration(
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setExpiration(
      tokenId: PromiseOrValue<BigNumberish>,
      timestamp: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}
