import { utils, BigNumber, BytesLike } from 'ethers';

export const generateId = (address: string, constrains: BigNumber):BigNumber => {
    if (utils.isAddress(address)) {
        let hexConstrains = constrains.toHexString();
        let combinedHex = utils.hexConcat([hexConstrains, address]);
        let bytes32 = utils.hexZeroPad(combinedHex, 32);

        let bn = BigNumber.from(bytes32);
        return bn
    }
}
