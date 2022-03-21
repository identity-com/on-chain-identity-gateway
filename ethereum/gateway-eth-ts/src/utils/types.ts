import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, Contract, PopulatedTransaction } from "ethers";
import { TxOptions } from "../utils/tx";

export declare type TokenData = {
    owner: string,
    state: number | string,
    identity: string, 
    expiration: number | BigNumber | string,
    bitmask: number | BigNumber | string,
}

export class SendableTransaction<T> {
    constructor(
        readonly contract: Contract, 
        readonly transaction: PopulatedTransaction, 
        readonly options?: TxOptions) {}
    
    async send():Promise<SentTransaction<T>> {
        const result = await this.contract.signer.sendTransaction(this.transaction);
        return new SentTransaction<T>(result, this.options);
    }
}

export class SentTransaction<T> {
    constructor(
        readonly response: TransactionResponse, 
        readonly options?: TxOptions) {}

    async confirm(): Promise<TransactionReceipt> {
        return this.response.wait(this.options?.confirmations);
    }
}
