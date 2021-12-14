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

    // Mapping for gateway token id to bitmaps
    mapping(uint256 => uint256) private _bitmasks;

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
    function _getBitMask(uint256 _tokenId) internal view returns (uint256) {
        return _bitmasks[_tokenId];
    }

    /**
    * @dev Internal function to set full bitmask for gateway token
    * @notice This function rewrites previous bitmask, use _addBitmask if you need to add flags to existing bitmask
    */
    function _setBitMask(uint256 _tokenId, uint256 _mask) internal {
        _checkSupportedBits(_mask);
        _bitmasks[_tokenId] = _mask;

        emit BitMaskUpdated(_tokenId, _mask);
    }

    /**
    * @dev Internal function to add `_mask` to existing bitmask for gateway token with `_tokenId`
    * @notice This function performs validation on supported flags on the gateway token system level
    */
    function _addBitMask(uint256 _tokenId, uint256 _mask) internal {
        uint256 mask = _bitmasks[_tokenId];
        uint256 newMask = mask.or(_mask);
        _checkSupportedBits(newMask);

        _bitmasks[_tokenId] = newMask;

        emit BitMaskUpdated(_tokenId, newMask);
    }

    /**
    * @dev Internal function to add one bit at particular `_index` for gateway token with `_tokenId`
    * @notice This function performs validation on supported flags on the gateway token system level
    */
    function _addBit(uint256 _tokenId, uint8 _index) internal {
        uint256 mask = _bitmasks[_tokenId];
        uint256 newMask = mask.setBit(_index);
        _checkSupportedBits(newMask);

        _bitmasks[_tokenId] = newMask;

        emit BitMaskUpdated(_tokenId, newMask);
    }

    /**
    * @dev Internal function to remove bits in `_removingMask` for gateway token with `_tokenId`
    */
    function _removeBits(uint256 _tokenId, uint8 _removingMask) internal {
        uint256 mask = _bitmasks[_tokenId];
        uint256 newMask = mask.negate();
        
        newMask = newMask.or(_removingMask);
        newMask = newMask.negate();
        _bitmasks[_tokenId] = newMask;

        emit BitMaskUpdated(_tokenId, newMask);
    }

    /**
    * @dev Internal function to clear one bit in particular `_index` for gateway token with `_tokenId`
    * @notice This function performs validation on supported flags on the gateway token system level
    */
    function _clearBit(uint256 _tokenId, uint8 _index) internal {
        uint256 mask = _bitmasks[_tokenId];
        uint256 newMask = mask.clearBit(_index);
        _checkSupportedBits(newMask);

        _bitmasks[_tokenId] = newMask;

        emit BitMaskUpdated(_tokenId, newMask);
    }

    /**
    * @dev Internal function to delete bitmask associated with `_tokenId`
    */
    function _clearBitMask(uint256 _tokenId) internal {
        delete _bitmasks[_tokenId];
        emit BitMaskUpdated(_tokenId, 0);
    }

    /**
    * @dev Internal function to check if gateway token bitmask contains any high risk bits using `_highRiskBitMask` mask
    * @notice Returns false if bitmask has no high risk bits, true otherwise
    */
    function _checkHighRiskBitMask(uint256 _tokenId, uint256 _highRiskBitMask) internal view returns (bool) {
        uint256 mask = _bitmasks[_tokenId];
        uint256 riskMask = mask.and(_highRiskBitMask);

        return riskMask != uint256(0);
    }

    /**
    * @dev Internal function to check if `_mask` contains only supported bits from FlagsStorage
    */
    function _checkSupportedBits(uint256 _mask) internal {
        uint256 supportedMask = flagsStorage.supportedFlagsMask();
        require(supportedMask == supportedMask.or(_mask), "UNSUPPORTED BITS");
    }

    /**
    * @dev Internal function to clear unsupported bits for gateway token bitmask with `_tokenId`
    */
    function _checkUnsupportedBits(uint256 _tokenId) internal {
        uint256 unsupportedBitMask = flagsStorage.unsupportedFlagsMask();
        uint256 mask = _bitmasks[_tokenId];
        uint256 targetBits = mask.and(unsupportedBitMask);

        if (targetBits != uint256(0)) {
            mask = mask.negate();
            mask = mask.or(targetBits);
            mask = mask.negate();

            _bitmasks[_tokenId] = mask;
            emit BitMaskUpdated(_tokenId, mask);
        }
    }
}
