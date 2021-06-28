// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IGatewayTokenController {
    /**
    * @dev Emitted when Civic Admin transfered from `previousAdmin` to `admin`.
    */
    event AdminTransfered(address indexed previousAdmin, address indexed admin);

    /**
    * @dev Emitted when new GatewayToken contract deployed with 
    * associated `name` and `symbol` to specific `address`.
    */
    event GatewayTokenCreated(address indexed tokenAddress, string name, string symbol);

    /**
    * @dev Emitted when GatewayTokens allowed to transfer for token owners.
    */
    event TransfersAcceptedBatch(address[] indexed tokens);

    /**
    * @dev Emitted when GatewayTokens restricted to transfer for token owners.
    */
    event TransfersRestrictedBatch(address[] indexed tokens);

    /**
    * @dev Emitted when `blacklisted` address is blocked to own tokens in any GatewayToken contract.
    */
    event Blacklisted(address indexed blacklisted);

    /**
    * @dev Emitted when Network Authorities added to Gateway Token at `token` address.
    */
    event NetworkAuthoritiesAdded(address indexed token, address[] indexed networkAuthorities);

    /**
    * @dev Emitted when Network Authorities removed to Gateway Token at `token` address.
    */
    event NetworkAuthoritiesRemoved(address indexed token, address[] indexed networkAuthorities);

    /**
    * @dev Triggers to get Civic System Admin
    */
    function civicAdmin() external view returns (address);

    /**
    * @dev Transfers Gateway Token system admin access in case Civic changes the main management address
    * @param newAdmin Address to transfer admin role for.
    */
    function transferAdmin(address newAdmin) external;

    /**
    * @dev Accepts owner's transfers for specified gateway tokens
    * @param tokens Gateway Token contracts address array
    */
    function acceptTransfersBatch(address[] memory tokens) external;

    /**
    * @dev Restricts owner's transfers for specified gateway tokens
    * @param tokens Gateway Token contracts address array
    */
    function restrictTransfersBatch(address[] memory tokens) external;

    /**
    * @dev Blacklists specified `user` completely, user can't get KYC verification on any gateway token networks.
    * @param user Address to blacklist.
    *
    * @notice Once user is blacklisted there is no way to whitelist, please use this function carefully.
    */
    function blacklist(address user) external;

    /**
    * @dev Checks if specified `user` blacklisted completely. 
    * If user blacklisted gateway token clients not able to verify identity, 
    * and gatekeepers have to burn tokens owned by blacklisted users.
    *
    * @param user Address to check.
    */
    function isBlacklisted(address user) external view returns (bool);

    /**
    * @dev Deploys new Gateway Token and save address at gatewayTokens address set.
    * @param _name Gateway Token name
    * @param _symbol Gateway Token symbol
    */
    function deployGatewayToken(string memory _name, string memory _symbol) external returns (address tokenAddress);

    /**
    * @dev Triggers to add multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by civicAdmin
    */
    function addNetworkAuthorities(address token, address[] memory authorities) external;

    /**
    * @dev Triggers to remove multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by civicAdmin
    */
    function removeNetworkAuthorities(address token, address[] memory authorities) external;
}