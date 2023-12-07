// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ChargeParties} from "../library/Charge.sol";

interface IERC721Freezable {
    /**
     * @dev Emitted when a token is frozen by gatekeeper
     */
    event Freeze(uint256 indexed tokenId);

    /**
     * @dev Emitted when a token is unfrozen by gatekeeper
     */
    event Unfreeze(uint256 indexed tokenId);

    /**
     * @dev Triggers to freeze gateway token
     * @param tokenId Gateway token id
     */
    function freeze(uint256 tokenId, ChargeParties memory partiesInCharge) external;

    /**
     * @dev Triggers to unfreeze gateway token
     * @param tokenId Gateway token id
     */
    function unfreeze(uint256 tokenId, ChargeParties memory partiesInCharge) external;
}
