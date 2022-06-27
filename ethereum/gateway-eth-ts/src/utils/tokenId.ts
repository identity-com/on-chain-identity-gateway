import {BigNumber, utils} from "ethers";

export const generateId = (
  address: string,
  constraints: BigNumber
): BigNumber => {
  if (utils.isAddress(address)) {
    const hexConstraints = constraints.toHexString();
    const combinedHex = utils.hexConcat([hexConstraints, address]);
    const bytes32 = utils.hexZeroPad(combinedHex, 32);

    return BigNumber.from(bytes32);
  }
};
