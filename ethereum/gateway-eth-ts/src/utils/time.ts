import { BigNumberish } from "ethers";
import { ZERO_BN } from "./constants";

export const getExpirationTime = (expiration?: BigNumberish): bigint => {
  const now = Math.floor(Date.now() / 1000);
  const bnTime = BigInt(now);

  // missing expiration
  if (!expiration) return ZERO_BN;

  if (typeof expiration === "number") {
    expiration = BigInt(expiration);
  }

  if (BigInt(expiration) < ZERO_BN) {
    throw new Error("Negative expiration time not allowed");
  }

  return bnTime + BigInt(expiration);
};
