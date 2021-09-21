import { BigNumber } from "@ethersproject/bignumber";
import { DEFAULT_EXPIRATION, DEFAULT_EXPIRATION_BN } from "./constants";

export const getExpirationTime = (expiration?: number | BigNumber): BigNumber => {
    const now = Math.floor(Date.now() / 1000);
    const bnTime = BigNumber.from(now);

    if (expiration != null) {
        return bnTime.add(expiration);    
    } else {
        return bnTime.add(DEFAULT_EXPIRATION_BN);
    } 
  }
