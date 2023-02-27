import { BigNumber, BigNumberish } from "ethers";
import { ZERO_BN } from "./constants";

export const getExpirationTime = (expiration?: BigNumberish): BigNumber => {
  const now = Math.floor(Date.now() / 1000);
  const bnTime = BigNumber.from(now);

  // missing expiration
  if (!expiration) return ZERO_BN;

  if (typeof expiration === "number") {
    expiration = BigNumber.from(expiration.toString());
  }

  if (BigNumber.from(expiration).lt(ZERO_BN)) {
    throw new Error("Negative expiration time not allowed");
  }

  return bnTime.add(expiration);
};
