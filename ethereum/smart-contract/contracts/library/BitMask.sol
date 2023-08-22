// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

library BitMask {
    uint internal constant _ONE = uint256(1);

    /**
     * @dev Internal function to set 1 bit in specific `index`
     * @return Updated bitmask with modified bit at `index`
     */
    function setBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self | (_ONE << index);
    }

    /**
     * @dev Internal function to clear bit to 0 in specific `index`
     * @return Updated bitmask with modified bit at `index`
     */
    function clearBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self & ~(_ONE << index);
    }

    /**
     * @dev Internal function to check bit at specific `index`
     * @return Returns TRUE if bit is '1', FALSE otherwise
     */
    function checkBit(uint256 self, uint8 index) internal pure returns (bool) {
        return (self & (uint256(1) << index)) > 0;
    }
}
