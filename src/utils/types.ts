import { BigNumber } from "ethers";

export declare type TokenState = {
    owner: string,
    state: number | string,
    identity: string, 
    expiration: number | BigNumber | string,
    bitmask: number | BigNumber | string,
}