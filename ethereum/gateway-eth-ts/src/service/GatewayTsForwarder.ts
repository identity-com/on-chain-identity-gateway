import {
  Provider,
  Overrides,
  ContractTransaction,
  BigNumberish,
  Signer,
  Addressable,
  ContractMethodArgs,
} from "ethers";
import { IForwarder, GatewayToken } from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import {
  mappedOpNames,
  WriteOps,
  ReadOnlyOperation,
  readOnlyOpNames,
} from "../utils/types";
import { pick } from "ramda";
import { signMetaTxRequest } from "../utils/metatx";
import { Charge, ChargeType } from "../utils/charge";
import { TypedContractMethod } from "../contracts/typechain-types/common";

// This is the default gas limit used by the GatewayTs forwarder
// if not overridden.
// The Forwarder requires a gas limit to be set, as it is what is passed into the
// inner transaction and signed. Without this, the forwarder would not know
// how much gas to send to the recipient smart contract.
// This gas limit will be ignored if the populatedTransaction includes its own gasLimit,
// so it can be overridden for each transaction if necessary.
const DEFAULT_GAS_LIMIT = 500_000;

export type ForwarderOptions = Omit<Overrides, "gasLimit"> & {
  gasLimit?: BigNumberish;
};

// This is essentially the GatewayToken contract type, but with the write operations converted to returning PopulatedTransactions.
// ethers.js contract.populateTransaction is a bit interesting, because it returns a PopulatedTransaction not just for
// write operations (which we want), but also for read operations (which we don't want, because we want to just call those).
// So this type changes that, by only converting the types for the write operations.
// This requires the passed-in contract object to be reconstructed to match this type in the constructor of
// GatewayTsForwarder.
type MappedGatewayToken = ReadOnlyOperation & Pick<GatewayToken, WriteOps>;

// Given an ethers.js contract function that returns a PopulatedTransaction,
// return a function that:
// 1) signs the transaction as typedData according to ERC712
// 2) wraps that populated transaction in an ERC2770 metatransaction
// 3) creates a populatedTransaction pointing that metatx to the forwarder contracts
const toMetaTx =
  (
    forwarderContract: IForwarder,
    toContract: Addressable,
    wallet: Signer,
    defaultGasLimit: number | BigNumberish
  ) =>
  <TArgs extends any[], TReturn>(
    method: TypedContractMethod<TArgs, TReturn>
  ) => {
    return async (
      ...args: ContractMethodArgs<TArgs>
    ): Promise<ContractTransaction> => {
      const populatedTransaction: ContractTransaction =
        await method.populateTransaction(...args);

      const { request, signature } = await signMetaTxRequest(
        wallet,
        forwarderContract,
        {
          from: await wallet.getAddress(),
          to: await toContract.getAddress(),
          data: populatedTransaction.data,
          // if there is a value, add it to the request
          // the forwarder passes the value in the request to the target contract
          // so if it is not included here, it would be zero, even if the outer transaction had a value
          ...(populatedTransaction.value
            ? { value: populatedTransaction.value }
            : {}),
          gas: populatedTransaction.gasLimit || defaultGasLimit,
        }
      );
      const populatedForwardedTransaction: ContractTransaction =
        await forwarderContract.execute.populateTransaction(request, signature);
      // ethers will set the from address on the populated transaction to the current wallet address (i.e the gatekeeper)
      // we don't want this, as the tx will be sent by some other relayer, so remove it.
      delete populatedForwardedTransaction.from;
      return populatedForwardedTransaction;
    };
  };

// A GatewayToken API that returns an unsigned metatransaction pointing to the Forwarder contract, rather than
// a transaction directly on the GatewayToken contract. Use this for relaying. The resultant contract can be signed
// and sent by any public key.
export class GatewayTsForwarder extends GatewayTsInternal<
  MappedGatewayToken,
  ContractTransaction
> {
  constructor(
    providerOrWallet: Provider | Signer,
    gatewayTokenContract: GatewayToken,
    forwarderContract: IForwarder,
    options: ForwarderOptions
  ) {
    const signer =
      "signTypedData" in providerOrWallet ? providerOrWallet : undefined;
    const toMetaTxFn = toMetaTx(
      forwarderContract,
      gatewayTokenContract,
      signer,
      options.gasLimit || DEFAULT_GAS_LIMIT
    );

    // construct a new mappedGatewayToken object comprising write operations that return PopulatedTransactions
    // and read operations that don't. See the description of MappedGatewayToken above for more details.
    const raw: ReadOnlyOperation = pick(readOnlyOpNames, gatewayTokenContract);
    const wrappedFns = mappedOpNames.map((name) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const wrappedFn = toMetaTxFn(gatewayTokenContract[name]);
      return [name, wrappedFn];
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mapped: Pick<GatewayToken, WriteOps> = Object.fromEntries(wrappedFns);

    const mappedGatewayToken = {
      ...mapped,
      ...raw,
    };
    super(mappedGatewayToken, options);
  }

  async issue(
    owner: string,
    network: bigint,
    expiry?: bigint,
    bitmask?: bigint,
    charge?: Charge
  ): Promise<ContractTransaction> {
    const tx = await super.issue(owner, network, expiry, bitmask, charge);

    if (charge?.chargeType === ChargeType.ETH) {
      tx.value = charge.value as bigint;
    }

    return tx;
  }

  async refresh(
    owner: string,
    network: bigint,
    expiry?: BigNumberish,
    charge?: Charge
  ): Promise<ContractTransaction> {
    const tx = await super.refresh(owner, network, expiry, charge);

    if (charge?.chargeType === ChargeType.ETH) {
      tx.value = charge.value as bigint;
    }
    return tx;
  }
}
