import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { parse, Transaction } from "@ethersproject/transactions"
import { BigNumber, BigNumberish, Bytes, BytesLike, Contract, PopulatedTransaction } from "ethers/lib/ethers";
import { estimateGasPrice, GasPriceKey } from "./gas";

export declare type TxBase = {
    to?: string,
    from?: string,
    nonce?: BigNumberish,

    gasLimit?: BigNumberish,
    gasPrice?: number | bigint | BigNumber | Bytes | GasPriceKey,

    data?: BytesLike,
    value?: BigNumberish,
    chainId?: number
}

export interface TxOptions extends TxBase {
    confirmations?: number
}

export const populateTx = async (contract: Contract, method: string, args: any[], options?: TxOptions): Promise<PopulatedTransaction> => {
    const overrides = {
        gasPrice: options?.gasPrice,
        value: options?.value,
        gasLimit: options?.gasLimit,
    };

    if (options?.gasPrice === undefined) {
        overrides.gasPrice = await estimateGasPrice();
    } else if (typeof(options?.gasPrice) === "string") {
        overrides.gasPrice = await estimateGasPrice(options?.gasPrice);
    }

    if (options?.gasLimit === undefined) {
        overrides.gasLimit = await contract.estimateGas[method](...args);
    }

    args.push(overrides);
    const txRequest: PopulatedTransaction = await contract.populateTransaction[method](...args);

    return txRequest;
}

export const ethTransaction = async (contract: Contract, method: string, args: any[], options?: TxOptions):Promise<string> => {
    const txRequest : PopulatedTransaction = await populateTx(contract, method, args, options);

    if (options?.confirmations !== undefined && options?.confirmations > 0) {
        const tx: TransactionReceipt = await (await contract.signer.sendTransaction(txRequest)).wait(options?.confirmations);

        return tx.transactionHash;
    } 
        const tx: TransactionResponse = await contract.signer.sendTransaction(txRequest);
        
        return tx.hash;
    
}

export const signTranaction = async (contract: Contract, method: string, args: any[], options?: TxOptions):Promise<Transaction> => {
    const txRequest: PopulatedTransaction = await populateTx(contract, method, args, options);

    const tx = await contract.signer.signTransaction(txRequest);

    return parse(tx);
}
