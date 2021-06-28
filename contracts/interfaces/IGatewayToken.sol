// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGatewayToken {
    /**
    * @dev Emitted when GatewayToken allowed to transfer for token owners by `account`.
    */
    event TransfersAccepted(address account);

    /**
    * @dev Emitted when GatewayToken restricted to transfer for token owners by `account`.
    */
    event TransfersRestricted(address account);

    /**
    * @dev Triggers to add new network authority into the system. 
    * @param authority Network Authority address
    *
    * @notice Only triggered by Civic Admin
    */
    function addNetworkAuthority(address authority) external returns (bool);

    /**
    * @dev Triggers to remove existing network authority from gateway token. 
    * @param authority Network Authority address
    *
    * @notice Only triggered by Civic Admin
    */
    function removeNetworkAuthority(address authority) external returns (bool);

    /**
    * @dev Triggers to allow token transfers by token owners. 
    *
    * @notice Only triggered by Civic Admin
    */
    function allowTransfers() external returns (bool);

    /**
    * @dev Triggers to stop token transfers by token owners. 
    *
    * @notice Only triggered by Civic Admin
    */
    function stopTransfers() external returns (bool);
}