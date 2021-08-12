// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC721Expirable {
    /**
    * @dev Emitted when expiration set to `tokenId`
    */
    event Expiration(uint256 indexed tokenId, uint256 timestamp);

    /**
    * @dev Triggers to mint gateway token with specified expiration `timestamp`
    * @param to Gateway token owner
    * @param tokenId Gateway token id
    * @param timestamp Expiration timestamp
    */
    function mintWithExpiration(address to, uint256 tokenId, uint256 timestamp) external;

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function expiration(uint256 tokenId) external view returns (uint256);

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    * @param tokenId Expiration timestamp
    */
    function setExpiration(uint256 tokenId, uint256 timestamp) external;
}