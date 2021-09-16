// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library BitMask {

    uint constant internal ONE = uint256(1);
    uint constant internal ONES = ~uint256(0);

    /**
    * @dev Internal function to set 1 bit in specific `index`
    * @return Updated bitmask with modified bit at `index`
    */
    function setBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self | ONE << index;
    }

    /**
    * @dev Internal function to clear bit to 0 in specific `index`
    * @return Updated bitmask with modified bit at `index`
    */
    function clearBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self & ~(ONE << index);
    }

    /**
    * @dev Internal function to check bit at specific `index`
    * @return Returns TRUE if bit is '1', FALSE otherwise
    */
    function checkBit(uint256 self, uint8 index) internal pure returns (bool) {
        return (self & (uint256(1) << index)) > 0;
    }

    /**
    * @dev Internal function to apply NOT operator for a bit in specific `index`
    * If the original bit is '1' sets bit to '0'
    * If the original bit is '0' sets bit to '1'
    * @return Updated bitmask with modified bit at `index`
    */
    function toggleBit(uint256 self, uint8 index) internal pure returns (uint256) {
        return self ^ ONE << index;
    }

    /**
    * @dev AND operator between two bitmasks:
    * '0' AND '0' -> '0'
    * '0' AND '1' -> '0'
    * '1' AND '0' -> '0'
    * '1' AND '1' -> '1'
    */
    function and(uint256 self, uint256 mask) internal pure returns (uint256) {
        return self & mask;
    }
    
    /**
    * @dev OR operator between two bitmasks:
    * '0' OR '0' -> '0'
    * '0' OR '1' -> '1'
    * '1' OR '0' -> '1'
    * '1' OR '1' -> '1'
    */
    function or(uint256 self, uint256 mask) internal pure returns (uint256) {
        return self | mask;
    }
    
    /**
    * @dev XOR operator between two bitmasks:
    * '0' XOR '0' -> '0'
    * '0' XOR '1' -> '1'
    * '1' XOR '0' -> '1'
    * '1' XOR '1' -> '0'
    */
    function xor(uint256 self, uint256 mask) internal pure returns (uint256) {
        return self ^ mask;
    }
    
    /**
    * @dev NOT operator:
    * '0' NOT -> '1'
    * '1' NOT -> '0'
    */
    function negate(uint256 self) internal pure returns (uint256) {
        return self ^ ONES;
    }

    /**
    * @dev NOT operator:
    * '0' NOT -> '1'
    * '1' NOT -> '0'
    */
    function not(uint256 self) internal pure returns (uint256) {
        return ~self;
    }
    
    /**
    * @dev Left shift of `self` bitmask by `index`:
    */
    function shiftLeft(uint256 self, uint8 index) internal pure returns (uint256) {
        return self << index;
    }
    
    /**
    * @dev Left shift of `self` bitmask by `index`:
    */
    function shiftRight(uint256 self, uint8 index) internal pure returns (uint256) {
        return self >> index;
    }
}