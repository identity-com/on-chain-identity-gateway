// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721Freezeble {
    /**
    * @dev Emitted when token freezed by gatekeeper
    */
    event Freeze(uint256 indexed tokenId);

    /**
    * @dev Emitted when token unfreezed by gatekeeper
    */
    event Unfreeze(uint256 indexed tokenId);

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function freeze(uint256 tokenId) external;

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    */
    function unfreeze(uint256 tokenId) external;
}