// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ChargeParties} from "../library/Charge.sol";

interface IERC721Expirable {
    /**
     * @dev Emitted when expiration set to `tokenId`
     */
    event Expiration(uint256 indexed tokenId, uint256 timestamp);

    /**
     * @dev Set the gateway token expiry
     * @param tokenId Gateway token id
     * @param tokenId Expiration timestamp
     */
    function setExpiration(uint256 tokenId, uint256 timestamp, ChargeParties calldata partiesInCharge) external payable;

    /**
     * @dev Get the gateway token expiry
     * @param tokenId Gateway token id
     */
    function getExpiration(uint256 tokenId) external view returns (uint256);
}
