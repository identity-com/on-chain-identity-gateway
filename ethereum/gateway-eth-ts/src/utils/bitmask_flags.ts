import { BigNumber } from "@ethersproject/bignumber";
import { ONE_BN } from "./constants";

export const addFlagsToBitmask = (
  bitmask: BigNumber,
  flags: number[]
): BigNumber => {
  for (const index of flags) {
    if (index >= 256) break;
    bitmask = bitmask.or(ONE_BN.shl(index));
  }

  return bitmask;
};
