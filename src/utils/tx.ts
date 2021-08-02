import { BigNumberish, BytesLike } from "ethers/lib/ethers";

export declare type TxBase = {
    to?: string,
    from?: string,
    nonce?: BigNumberish,

    gasLimit?: BigNumberish,
    gasPrice?: BigNumberish,

    data?: BytesLike,
    value?: BigNumberish,
    chainId?: number
}
