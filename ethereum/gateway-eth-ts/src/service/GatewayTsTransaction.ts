import { Wallet, Contract, Overrides, PopulatedTransaction } from "ethers";
import { Forwarder, GatewayToken } from "../contracts/typechain-types";
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

type MappedGatewayToken = ReadOnlyOperation &
  Pick<GatewayToken["populateTransaction"], WriteOps>;

// A GatewayToken API that returns an PopulatedTransaction, rather than
// a transaction directly on the GatewayToken contract. Use this for relaying with relayers that provide their own
// forwarder, or any other process that wants to separate tx building and signing
export class GatewayTsTransaction extends GatewayTsInternal<
  MappedGatewayToken,
  PopulatedTransaction
> {
  constructor(gatewayTokenContract: GatewayToken, options?: Overrides) {
    // construct a new mappedGatewayToken object comprising write operations that return PopulatedTransactions
    // and read operations that don't. See the description of MappedGatewayToken above for more details.
    const raw: ReadOnlyOperation = pick(readOnlyOpNames, gatewayTokenContract);
    const mapped: Pick<GatewayToken["populateTransaction"], WriteOps> = pick(
      mappedOpNames,
      gatewayTokenContract.populateTransaction
    );
    const mappedGatewayToken = {
      ...mapped,
      ...raw,
    };
    super(mappedGatewayToken, options);
  }
}
