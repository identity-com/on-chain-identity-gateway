// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ChargeParties} from "../library/Charge.sol";

interface IERC721Revokable {
    /**
     * @dev Emitted when GatewayToken is revoked.
     */
    event Revoke(uint256 indexed tokenId);

    /**
     * @dev Triggers to revoke gateway token
     * @param tokenId Gateway token id
     */
    function revoke(uint256 tokenId, ChargeParties memory partiesInCharge) external;
}
