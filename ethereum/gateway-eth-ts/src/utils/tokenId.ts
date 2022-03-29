import { utils, BigNumber } from "ethers";

export const generateId = (
  address: string,
  constrains: BigNumber
): BigNumber => {
  if (utils.isAddress(address)) {
    const hexConstrains = constrains.toHexString();
    const combinedHex = utils.hexConcat([hexConstrains, address]);
    const bytes32 = utils.hexZeroPad(combinedHex, 32);

    const bn = BigNumber.from(bytes32);
    return bn;
  }
};
