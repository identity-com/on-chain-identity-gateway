import { Wallet, Contract, Overrides, PopulatedTransaction } from "ethers";
import {
  IForwarder,
  GatewayToken,
  FlexibleNonceForwarder,
} from "../contracts/typechain-types";
import { GatewayTsInternal } from "./GatewayTsInternal";
import {
  mappedOpNames,
  WriteOps,
  ReadOnlyOperation,
  readOnlyOpNames,
} from "../utils/types";
import { mapObjIndexed, pick } from "ramda";
import { signMetaTxRequest } from "../utils/metatx";
import { Provider } from "@ethersproject/providers";

// This is essentially the GatewayToken contract type, but with the write operations converted to returning PopulatedTransactions.
// ethers.js contract.populateTransaction is a bit interesting, because it returns a PopulatedTransaction not just for
// write operations (which we want), but also for read operations (which we don't want, because we want to just call those).
// So this type changes that, by only converting the types for the write operations.
// This requires the passed-in contract object to be reconstructed to match this type in the constructor of
// GatewayTsForwarder.
type MappedGatewayToken = ReadOnlyOperation &
  Pick<GatewayToken["populateTransaction"], WriteOps>;

type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never;

// Given an ethers.js contract function that returns a PopulatedTransaction,
// return a function that:
// 1) signs the transaction as typedData according to ERC712
// 2) wraps that populated transaction in an ERC2770 metatransaction
// 3) creates a populatedTransaction pointing that metatx to the forwarder contracts
const toMetaTx =
  (forwarderContract: IForwarder, toContract: Contract, wallet: Wallet) =>
  <TFunc extends (...args: any[]) => Promise<PopulatedTransaction>>(
    fn: TFunc
  ): ((...args: InferArgs<TFunc>) => Promise<PopulatedTransaction>) =>
  async (...args) => {
    if (!wallet) {
      throw new Error("A wallet is required to sign the meta transaction");
    }

    const populatedTransaction = await fn(...args);
    const { request, signature } = await signMetaTxRequest(
      wallet,
      forwarderContract,
      {
        from: wallet.address,
        to: toContract.address,
        data: populatedTransaction.data,
      }
    );
    const populatedForwardedTransaction: PopulatedTransaction =
      await forwarderContract.populateTransaction.execute(request, signature);
    // ethers will set the from address on the populated transaction to the current wallet address (i.e the gatekeeper)
    // we don't want this, as the tx will be sent by some other relayer, so remove it.
    delete populatedForwardedTransaction.from;
    return populatedForwardedTransaction;
  };

// A GatewayToken API that returns an unsigned metatransaction pointing to the Forwarder contract, rather than
// a transaction directly on the GatewayToken contract. Use this for relaying. The resultant contract can be signed
// and sent by any public key.
export class GatewayTsForwarder extends GatewayTsInternal<
  MappedGatewayToken,
  PopulatedTransaction
> {
  constructor(
    // ethers.js requires a Wallet instead of Signer for the _signTypedData function, until v6
    providerOrWallet: Provider | Wallet,
    gatewayTokenContract: GatewayToken,
    forwarderContract: IForwarder,
    options?: Overrides
  ) {
    const wallet =
      "_signTypedData" in providerOrWallet ? providerOrWallet : undefined;
    const toMetaTxFn = toMetaTx(
      forwarderContract,
      gatewayTokenContract,
      wallet
    );

    // construct a new mappedGatewayToken object comprising write operations that return PopulatedTransactions
    // and read operations that don't. See the description of MappedGatewayToken above for more details.
    const raw: ReadOnlyOperation = pick(readOnlyOpNames, gatewayTokenContract);
    const mapped: Pick<GatewayToken["populateTransaction"], WriteOps> =
      mapObjIndexed(
        toMetaTxFn,
        pick(mappedOpNames, gatewayTokenContract.populateTransaction)
      );
    const mappedGatewayToken = {
      ...mapped,
      ...raw,
    };
    super(mappedGatewayToken, options);
  }
}
