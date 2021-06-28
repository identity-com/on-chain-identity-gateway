// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./GatewayToken.sol";
import "./interfaces/IGatewayToken.sol";
import "./interfaces/IGatewayTokenController.sol";

/**
 * @dev Gateway Token Controller contract is responsible for managing Civic KYC gateway token set of smart contracts
 *
 * Contract handles multiple levels of access such as Network Authority (may represent a specific regulator body) 
 * Gatekeepers (Civic network parties who can mint/burn/freeze gateway tokens) and overall system Admin who can add
 * new Network Authorities
 */
contract GatewayTokenController is IGatewayTokenController {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private gatewayTokens;
    address public override civicAdmin;

    // Mapping from user address to blacklisted boolean
    mapping(address => bool) private _isBlacklisted;

    // @dev Modifier to prevent calls from anyone except Civic Admin
    modifier onlyAdmin() {
        require(civicAdmin == msg.sender, "NOT CIVIC_ADMIN");
        _;
    }

    /**
    * @dev Gateway Token Controller contract constructor. 
    * Grants admin role to contract deployer
    */
    constructor() public {
        civicAdmin = msg.sender;
    }

    // ===========  ADMIN CONTROLL SECTION ============

    /**
    * @dev Transfers Gateway Token system admin access in case Civic changes the main management address
    * @param newAdmin Address to transfer admin role for.
    */
    function transferAdmin(address newAdmin) public onlyAdmin override {
        civicAdmin = newAdmin;

        emit AdminTransfered(msg.sender, newAdmin);
    }

    // ===========  TOKEN MANAGEMENT SECTION ============

    /**
    * @dev Accepts owner's transfers for specified gateway tokens
    * @param tokens Gateway Token contracts address array
    */
    function acceptTransfersBatch(address[] memory tokens) public onlyAdmin override {
        for (uint256 i = 0; i < tokens.length; ++i) {
            address token = tokens[i];
            require(gatewayTokens.contains(token), "NOT GATEWAY TOKEN");
            IGatewayToken gt = IGatewayToken(token);

            require(gt.allowTransfers(), "TRANSFERS NOT ALLOWED");
        }

        emit TransfersAcceptedBatch(tokens);
    }

    /**
    * @dev Restricts owner's transfers for specified gateway tokens
    * @param tokens Gateway Token contracts address array
    */
    function restrictTransfersBatch(address[] memory tokens) public onlyAdmin override {
        for (uint256 i = 0; i < tokens.length; ++i) {
            address token = tokens[i];
            require(gatewayTokens.contains(token), "NOT GATEWAY TOKEN");
            IGatewayToken gt = IGatewayToken(token);

            require(gt.stopTransfers(), "TRANSFERS NOT ALLOWED");
        }

        emit TransfersRestrictedBatch(tokens);
    }

    // ===========  USER RESTRICTIONS SECTION ============

    /**
    * @dev Blacklists specified `user` completely, user can't get KYC verification on any gateway token networks.
    * @param user Address to blacklist.
    *
    * @notice Once user is blacklisted there is no way to whitelist, please use this function carefully.
    */
    function blacklist(address user) public onlyAdmin override {
        _isBlacklisted[user] = true;

        emit Blacklisted(user);
    }

    /**
    * @dev Checks if specified `user` blacklisted completely. 
    * If user blacklisted gateway token clients not able to verify identity, 
    * and gatekeepers have to burn tokens owned by blacklisted users.
    *
    * @param user Address to check.
    */
    function isBlacklisted(address user) public view override returns (bool) {
        return _isBlacklisted[user];
    }

    // ===========  GATEWAY TOKEN FACTORY SECTION ============

    /**
    * @dev Deploys new Gateway Token and save address at gatewayTokens address set.
    * @param _name Gateway Token name
    * @param _symbol Gateway Token symbol
    */
    function deployGatewayToken(string memory _name, string memory _symbol) public onlyAdmin override returns (address tokenAddress) {
        tokenAddress = address(new GatewayToken(_name, _symbol));
        gatewayTokens.add(tokenAddress);

        emit GatewayTokenCreated(tokenAddress, _name, _symbol);
        return tokenAddress;
    }

    // ===========  ACCESS CONTROLL SECTION ============

    /**
    * @dev Triggers to add multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by civicAdmin
    */
    function addNetworkAuthorities(address token, address[] memory authorities) public onlyAdmin virtual override {
        require(gatewayTokens.contains(token), "NOT GATEWAY TOKEN");
        IGatewayToken gt = IGatewayToken(token);

        for (uint256 i = 0; i < authorities.length; ++i) {
            address authority = authorities[i];

            require(gt.addNetworkAuthority(authority), "AUTHORITY NOT ADDED");
        }

        emit NetworkAuthoritiesAdded(token, authorities);
    }

    /**
    * @dev Triggers to remove multiple network authorities in gateway token contract. 
    * @param token Gateway Token contract address
    * @param authorities Network Authorities array
    *
    * @notice Only triggered by civicAdmin
    */
    function removeNetworkAuthorities(address token, address[] memory authorities) public onlyAdmin virtual override {
        require(gatewayTokens.contains(token), "NOT GATEWAY TOKEN");
        IGatewayToken gt = IGatewayToken(token);

        for (uint256 i = 0; i < authorities.length; ++i) {
            address authority = authorities[i];

            require(gt.removeNetworkAuthority(authority), "AUTHORITY NOT REMOVED");
        }

        emit NetworkAuthoritiesRemoved(token, authorities);
    }
}
