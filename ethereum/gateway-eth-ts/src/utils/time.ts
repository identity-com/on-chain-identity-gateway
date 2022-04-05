import { BigNumber } from "@ethersproject/bignumber";
import { DEFAULT_EXPIRATION_BN, ZERO_BN } from "./constants";

export const getExpirationTime = (
  expiration?: number | BigNumber
): BigNumber => {
  const now = Math.floor(Date.now() / 1000);
  const bnTime = BigNumber.from(now);

  if (typeof expiration === "number") {
    expiration = BigNumber.from(expiration.toString());
  }

  if (expiration && expiration.gt(ZERO_BN)) {
    return bnTime.add(expiration);
  }

  return bnTime.add(DEFAULT_EXPIRATION_BN);
};
