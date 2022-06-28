import {Contract, Overrides, Wallet} from "ethers";
import {Forwarder, GatewayToken} from "../contracts/typechain-types";
import {GatewayTsInternal} from "./GatewayTsInternal";
import {mappedOpNames, MappedOps, RawOperation, rawOpNames} from "../utils/types";
import {PopulatedTransaction} from "ethers/lib/ethers";
import {mapObjIndexed, pick} from "ramda";
import {signMetaTxRequest} from "../utils/metatx";
import {Provider} from "@ethersproject/providers";

type MappedGatewayToken = RawOperation & Pick<GatewayToken['populateTransaction'], MappedOps>

type InferArgs<T> = T extends (...t: [...infer Arg]) => any ? Arg : never;

const toMetaTx = (
  forwarderContract: Forwarder,
  toContract: Contract,
  wallet: Wallet
) => <TFunc extends (...args: any[]) => Promise<PopulatedTransaction>>(fn: TFunc)
  :
  (...args: InferArgs<TFunc>) => Promise<PopulatedTransaction> =>
  async (...args) => {
    if (!wallet) {
      throw new Error("A wallet is required to sign the meta transaction");
    }

    const populatedTransaction = await fn(...args);
    const {request, signature} = await signMetaTxRequest(wallet, forwarderContract, {
      from: wallet.address,
      to: toContract.address,
      data: populatedTransaction.data
    });
    const populatedForwardedTransaction = await forwarderContract.populateTransaction.execute(request, signature);
    // ethers will set the from address on the populated transaction to the current wallet address (i.e the gatekeeper)
    // we don't want this, as the tx will be sent by some other relayer, so remove it.
    delete populatedForwardedTransaction.from;
    return populatedForwardedTransaction;
  }

export class GatewayTsForwarder extends GatewayTsInternal<MappedGatewayToken, PopulatedTransaction> {
  constructor(
    // ethers.js requires a Wallet instead of Signer for the _signTypedData function, until v6
    providerOrWallet: Provider | Wallet,
    gatewayTokenContract: GatewayToken,
    forwarderContract: Forwarder,
    options?: Overrides
  ) {
    const wallet = '_signTypedData' in providerOrWallet ? providerOrWallet : undefined;
    const toMetaTxFn = toMetaTx(forwarderContract, gatewayTokenContract, wallet);
    const raw: RawOperation = pick(rawOpNames, gatewayTokenContract);
    const mapped: Pick<GatewayToken['populateTransaction'], MappedOps> 
      = mapObjIndexed(toMetaTxFn, pick(mappedOpNames, gatewayTokenContract.populateTransaction));
    const mappedGatewayToken = {
      ...mapped,
      ...raw,
    }
    super(mappedGatewayToken, options)
  }
}
