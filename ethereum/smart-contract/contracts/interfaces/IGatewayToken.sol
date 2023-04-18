// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

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

    /// The gatekeeper network being created already exists.
    /// @param network gatekeeper network id.
    error GatewayToken__NetworkAlreadyExists(uint network);

    /// The gatekeeper network does not exist.
    /// @param network gatekeeper network id.
    error GatewayToken__NetworkDoesNotExist(uint network);

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

    /**
     * @dev Triggers to verify if address has a GATEKEEPER role.
     * @param gatekeeper Gatekeeper address
     * @param network GatekeeperNetwork id
     */
    function isGatekeeper(address gatekeeper, uint256 network) external returns (bool);

    function createNetwork(uint256 network, string memory name, bool daoGoverned, address daoManager) external;

    function renameNetwork(uint256 network, string memory name) external;

    /**
     * @dev Triggers to add new network authority into the system.
     * @param authority Network Authority address
     * @param network GatekeeperNetwork id
     *
     * @notice Only triggered by Identity.com Admin
     */
    function addNetworkAuthority(address authority, uint256 network) external;

    /**
     * @dev Triggers to remove existing network authority from gateway token.
     * @param authority Network Authority address
     * @param network GatekeeperNetwork id
     *
     * @notice Only triggered by Identity.com Admin
     */
    function removeNetworkAuthority(address authority, uint256 network) external;

    /**
     * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role.
     * @param authority Network Authority address
     * @param network GatekeeperNetwork id
     */
    function isNetworkAuthority(address authority, uint256 network) external returns (bool);

    /**
     * @dev Transfers Gateway Token DAO Manager access from daoManager to `newManager`
     * @param newManager Address to transfer DAO Manager role for.
     */
    function transferDAOManager(address previousManager, address newManager, uint256 network) external;

    function mint(address to, uint256 network, uint256 expiration, uint256 mask, Charge calldata charge) external;

    /**
     * @dev Triggers to get all information relating to gateway `tokenId`
     * @param tokenId Gateway token id
     */
    function getToken(
        uint256 tokenId
    ) external view returns (address owner, uint8 state, string memory identity, uint256 expiration, uint256 bitmask);

    function getNetwork(uint256 network) external view returns (string memory);
}
