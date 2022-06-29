import {BigNumber, utils} from "ethers";
import {ZERO_BN} from "./constants";

export const generateId = (
  address: string,
  constraints: BigNumber = ZERO_BN
): BigNumber => {
  if (utils.isAddress(address)) {
    const hexConstraints = constraints.toHexString();
    const combinedHex = utils.hexConcat([hexConstraints, address]);
    const bytes32 = utils.hexZeroPad(combinedHex, 32);

    return BigNumber.from(bytes32);
  }
};
