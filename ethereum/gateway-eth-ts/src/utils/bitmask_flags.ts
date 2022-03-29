import { BigNumber } from "ethers/lib/ethers";
import { KYCFlags, maxFlagIndex } from "../lib/flags";
import { ONE_BN } from "./constants";

export const addFlagsToBitmask = (
  bitmask: BigNumber,
  flags: KYCFlags[] | number[]
): BigNumber => {
  let index: number;

  for (const flag of flags) {
    index = flag;

    if (index >= 256 || index >= maxFlagIndex) {
      break;
    }

    bitmask = bitmask.or(ONE_BN.shl(index));
  }

  return bitmask;
};
