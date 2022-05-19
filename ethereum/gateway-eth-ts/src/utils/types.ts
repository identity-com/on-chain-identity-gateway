import {
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import { BigNumber, Contract, PopulatedTransaction } from "ethers";
import { TxOptions } from "../utils/tx";

export declare type TokenData = {
  owner: string;
  state: number | string;
  identity: string;
  expiration: number | BigNumber | string;
  bitmask: number | BigNumber | string;
};

export class SendableTransaction {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly contract: Contract,
    readonly transaction: PopulatedTransaction,
    readonly options?: TxOptions
  ) {}

  async send(): Promise<SentTransaction> {
    const result = await this.contract.signer.sendTransaction(this.transaction);
    return new SentTransaction(result, this.options);
  }
}

export class SentTransaction {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    readonly response: TransactionResponse,
    readonly options?: TxOptions
  ) {}

  async confirm(): Promise<TransactionReceipt> {
    return this.response.wait(this.options?.confirmations);
  }
}
