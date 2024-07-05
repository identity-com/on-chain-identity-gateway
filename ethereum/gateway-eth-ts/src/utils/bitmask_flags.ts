import { ONE_BN } from "./constants";

export const addFlagsToBitmask = (bitmask: bigint, flags: number[]): bigint => {
  for (const index of flags) {
    if (index >= 256) break;
    bitmask = bitmask | (ONE_BN << BigInt(index));
  }

  return bitmask;
};
