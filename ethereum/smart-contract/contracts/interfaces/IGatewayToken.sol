// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {Charge} from "../library/Charge.sol";

interface IGatewayToken {
    enum TokenState {
        ACTIVE,
        FROZEN,
        REVOKED
    }

    /**
     * @dev Emitted when GatewayToken DAO Manager transferred to `newDAOManager` address.
     */
    event DAOManagerTransferred(address previousDAOManager, address newDAOManager, uint256 network);

    /// Insufficient funds for withdrawal. Needed `required` but only
    /// `available` available.
    /// @param available balance available.
    /// @param required requested amount to transfer.
    error GatewayToken__InsufficientFunds(uint256 available, uint256 required);


    /// The gatekeeper network does not exist.
    /// @param network gatekeeper network id.
    error GatewayToken__AddressNotAGatekeeper(uint network, address addr);

    /// The gatekeeper network is not dao-governed.
    /// @param network gatekeeper network id.
    error GatewayToken__NotDAOGoverned(uint network);

    /// The requested token does not exist.
    /// @param tokenId token id.
    error GatewayToken__TokenDoesNotExist(uint256 tokenId);

    /// The requested token is not active or does not exist
    /// @param tokenId token id.
    /// @param allowExpired whether to allow expired tokens.
    error GatewayToken__TokenDoesNotExistOrIsInactive(uint256 tokenId, bool allowExpired);

    /// The requested token state is invalid for the request
    /// @param tokenId token id.
    /// @param state current token state.
    /// @param expectedState expected token state.
    error GatewayToken__TokenInvalidStateForOperation(uint256 tokenId, TokenState state, TokenState expectedState);

    /// Token transfers are disabled
    error GatewayToken__TransferDisabled();

    function mint(
        address to,
        uint256 network,
        uint256 mask,
        Charge calldata charge
    ) external payable;

    /**
     * @dev Triggers to get all information relating to gateway `tokenId`
     * @param tokenId Gateway token id
     */
    function getToken(
        uint256 tokenId
    ) external view returns (address owner, uint8 state, string memory identity, uint256 expiration, uint256 bitmask);

}
