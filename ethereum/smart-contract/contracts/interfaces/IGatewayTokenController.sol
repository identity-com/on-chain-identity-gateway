// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IGatewayTokenController {
    /**
    * @dev Emitted when Identity.com Admin transfered from `previousAdmin` to `admin`.
    */
    event AdminTransfered(address indexed previousAdmin, address indexed admin);

    /**
    * @dev Emitted when Identity.com Admin updated FlagsStorage contract address from `previousFlagsStorage` to `flagsStorage`.
    */
    event FlagsStorageUpdated(address indexed previousFlagsStorage, address indexed flagsStorage);

    /**
    * @dev Emitted when new GatewayToken contract deployed with 
    * associated `name` and `symbol` to specific `address`.
    */
    event GatekeeperNetworkCreated(address indexed tokenAddress, string name, string symbol, address deployer);

    /**
    * @dev Emitted when GatewayTokens allowed to transfer for token owners by `account`.
    */
    event TransfersAcceptedBatch(address[] tokens, address account);

    /**
    * @dev Emitted when GatewayTokens restricted to transfer for token owners by `account`.
    */
    event TransfersRestrictedBatch(address[] tokens, address account);

    /**
    * @dev Emitted when `user` address is blocked to own tokens in any GatewayToken contract.
    */
    event Blacklisted(address indexed user);

    /**
    * @dev Emitted when multiple `users` addresses is blocked to own tokens in any GatewayToken contract.
    */
    event BlacklistedBatch(address[] users);

    /**
    * @dev Triggers to get Identity.com System Admin
    */
    function identityAdmin() external view returns (address);

    /**
    * @dev Transfers Gateway Token system admin access in case Identity.com changes the main management address
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
    * @dev Blacklist multiple `users`, user can't get KYC verification on any gateway token networks.
    * @param users User addresses to blacklist.
    *
    * @notice Once user is blacklisted there is no way to whitelist, please use this function carefully.
    */
    function blacklistBatch(address[] memory users) external;

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
    function createGatekeeperNetwork(string memory _name, string memory _symbol, bool _isDAOGoverned, address _daoExecutor, address trustedForwarder) external returns (address tokenAddress);

    /**
    * @dev Triggers to add multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by identityAdmin
    */
    function addNetworkAuthorities(address token, address[] memory authorities) external;

    /**
    * @dev Triggers to remove multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by identityAdmin
    */
    function removeNetworkAuthorities(address token, address[] memory authorities) external;
}