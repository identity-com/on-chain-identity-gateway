import { BigNumber } from "ethers/lib/ethers";
import { KYCFlags } from "../lib/flags";
import { ONE_BN, ZERO_BN } from "./constants";

export const addFlagsToBitmask = (bitmask: BigNumber = ZERO_BN, flags: KYCFlags[] | number[]):BigNumber => {
    let index: number;
    
    for (let i = 0; i < flags.length; i++) {
        index = flags[i];

        if (index >= 256) {
            break;
        }

        bitmask = bitmask.or(ONE_BN.shl(index));
    }

    return bitmask;
}