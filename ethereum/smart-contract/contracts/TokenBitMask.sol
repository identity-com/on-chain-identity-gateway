// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./library/BitMask.sol";
import "./interfaces/IFlagsStorage.sol";

/**
 * @dev TokenBitMask contract is an internal smart contract for Gateway Token
 * implementation that stores KYC flags per identity token in a bitmask
 */
contract TokenBitMask {
    using BitMask for uint256;

    /**
     * @dev Emitted when token BitMask associated with `tokenId` updated to `bitmask`.
     */
    event BitMaskUpdated(uint256 tokenId, uint256 bitmask);

    /**
     * @dev Emitted when Identity.com Admin updated FlagsStorage contract address from `previousFlagsStorage` to `flagsStorage`.
     */
    event FlagsStorageUpdated(address indexed flagsStorage);

    // Gateway Token system FlagsStorage contract address
    IFlagsStorage public flagsStorage;

    // Mapping for gateway token id to bitmask
    mapping(uint256 => uint256) private bitmasks;

    /**
     * @dev Internal funciton to set FlagsStorage contract address
     * @param _flagsStorage FlagsStorage contract address
     */
    function _setFlagsStorage(address _flagsStorage) internal {
        flagsStorage = IFlagsStorage(_flagsStorage);

        emit FlagsStorageUpdated(_flagsStorage);
    }

    /**
     * @dev Internal function to get gateway token bitmask
     */
    function _getBitMask(uint256 tokenId) internal view returns (uint256) {
        return bitmasks[tokenId];
    }

    /**
     * @dev Internal function to set full bitmask for gateway token
     * @notice This function rewrites previous bitmask, use _addBitmask if you need to add flags to existing bitmask
     */
    function _setBitMask(uint256 tokenId, uint256 mask) internal {
        bitmasks[tokenId] = mask;

        emit BitMaskUpdated(tokenId, mask);
    }

    /**
     * @dev Internal function to add `mask` to existing bitmask for gateway token with `tokenId`
     */
    function _addBitMask(uint256 tokenId, uint256 mask) internal {
        uint256 oldMask = bitmasks[tokenId];
        uint256 newMask = oldMask.or(mask);

        bitmasks[tokenId] = newMask;

        emit BitMaskUpdated(tokenId, newMask);
    }

    /**
     * @dev Internal function to add one bit at particular `index` for gateway token with `tokenId`
     */
    function _addBit(uint256 tokenId, uint8 index) internal {
        uint256 oldMask = bitmasks[tokenId];
        uint256 newMask = oldMask.setBit(index);

        bitmasks[tokenId] = newMask;

        emit BitMaskUpdated(tokenId, newMask);
    }

    /**
     * @dev Internal function to remove bits in `removingMask` for gateway token with `tokenId`
     */
    function _removeBits(uint256 tokenId, uint8 removingMask) internal {
        uint256 oldMask = bitmasks[tokenId];
        uint256 newMask = oldMask.negate();

        newMask = newMask.or(removingMask);
        newMask = newMask.negate();
        bitmasks[tokenId] = newMask;

        emit BitMaskUpdated(tokenId, newMask);
    }

    /**
     * @dev Internal function to clear one bit in particular `index` for gateway token with `tokenId`
     */
    function _clearBit(uint256 tokenId, uint8 index) internal {
        uint256 oldMask = bitmasks[tokenId];
        uint256 newMask = oldMask.clearBit(index);

        bitmasks[tokenId] = newMask;

        emit BitMaskUpdated(tokenId, newMask);
    }

    /**
     * @dev Internal function to delete bitmask associated with `tokenId`
     */
    function _clearBitMask(uint256 tokenId) internal {
        delete bitmasks[tokenId];
        emit BitMaskUpdated(tokenId, 0);
    }
}
