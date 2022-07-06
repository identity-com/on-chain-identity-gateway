// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../library/Charge.sol";

interface IERC721Expirable {
    /**
    * @dev Emitted when expiration set to `tokenId`
    */
    event Expiration(uint256 indexed tokenId, uint256 timestamp);

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function expiration(uint256 tokenId) external view returns (uint256);

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    * @param tokenId Expiration timestamp
    * @param charge The charge details for token issuance (ignored here - handled if at all by the forwarding contract)
    */
    function setExpiration(uint256 tokenId, uint256 timestamp, Charge calldata charge) external;
}