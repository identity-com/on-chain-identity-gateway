import { utils, BigNumber, BytesLike } from 'ethers';

export const generateTokenId = (address: string, constrains: BytesLike):BigNumber => {
    if (utils.isAddress(address)) {
        let hexConstrains = utils.hexlify(constrains);
        let combinedHex = utils.hexConcat([hexConstrains, address]);
        let bytes32 = utils.hexZeroPad(combinedHex, 32);

        let bn = BigNumber.from(bytes32);
        return bn
    }
}
