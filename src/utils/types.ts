import { BigNumber } from "ethers";

export declare type TokenState = {
    owner: string,
    isFreezed: boolean, 
    identity: string, 
    expiration: number | BigNumber
}