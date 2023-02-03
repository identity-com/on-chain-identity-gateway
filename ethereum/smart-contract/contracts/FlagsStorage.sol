// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IFlagsStorage.sol";
import "./library/BitMask.sol";

/**
 * @dev FlagsStorage is the main contract to store KYC-related flags for Gateway Token System.
 * KYC flags are identifiable by short identifiers in bytes32 strings. After adding flags 
 * those bit indexes could be used by GatewayToken implementations to associate flags per token.
 */
contract FlagsStorage is IFlagsStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using Address for address;
    using BitMask for uint256;

    EnumerableSet.Bytes32Set private supportedFlags;
    address public override superAdmin;

    uint256 public override supportedFlagsMask;

    mapping(bytes32 => uint8) public override flagIndexes;

    // @dev Modifier to prevent calls from anyone except Identity.com Admin
    modifier onlySuperAdmin() {
        require(msg.sender == superAdmin, "NOT SUPER ADMIN");
        _;
    }

    constructor(address _superAdmin) {
        superAdmin = _superAdmin;
    }

    /**
    * @dev Triggers to transfer ownership of this contract to new DAO Controller, reverts on zero address and wallet addresses
    * @param newSuperAdmin New DAO Controller contract address
    * @notice Only executed by existing DAO Manager
    */
    function updateSuperAdmin(address newSuperAdmin) onlySuperAdmin public override {
        require(newSuperAdmin != address(0), "NEW DAO CONTROLLER IS ZERO ADDRESS");
        require(newSuperAdmin.isContract(), "NEW DAO CONTROLLER IS NOT A CONTRACT");

        emit SuperAdminUpdated(superAdmin, newSuperAdmin);
        superAdmin = newSuperAdmin;
    }

    /**
    * @dev Triggers to add new flag into gateway token system
    * @param flag Flag short identifier
    * @param index Flag index (limited to 255)
    * @notice Only executed by existing DAO Manager
    */
    function addFlag(bytes32 flag, uint8 index) onlySuperAdmin public override {
        _addFlag(flag, index);
    }

    /**
    * @dev Triggers to add multiple flags into gateway token system
    * @param flags Array of flag short identifiers
    * @param indexes Array of flag indexes (limited to 255)
    * @notice Only executed by existing DAO Manager
    */
    function addFlags(bytes32[] memory flags, uint8[] memory indexes) onlySuperAdmin public override {
        require(flags.length == indexes.length, "Incorrect variables length");

        for (uint8 i = 0; i < flags.length; i++) {
            _addFlag(flags[i], indexes[i]);
        }
    }

    /**
    * @dev Triggers to remove existing flag from gateway token system
    * @param flag Flag short identifier
    * @notice Only executed by existing DAO Manager
    */
    function removeFlag(bytes32 flag) onlySuperAdmin public override {
        require(supportedFlags.contains(flag), "Flag not supported"); // additional check to reduce incorrect FlagRemoved event

        _removeFlag(flag);
    }

    /**
    * @dev Triggers to remove multiple existing flags from gateway token system
    * @param flags Array of flag short identifiers
    * @notice Only executed by existing DAO Manager
    */
    function removeFlags(bytes32[] memory flags) onlySuperAdmin public override {
        for (uint8 i = 0; i < flags.length; i++) {
            require(supportedFlags.contains(flags[i]), "Flag not supported"); // additional check to reduce incorrect FlagRemoved events

            _removeFlag(flags[i]);
        }
    }

    /**
    * @dev Triggers to check if a particular flag is supported
    * @param flag Flag short identifier
    * @return Boolean for flag support
    */
    function isFlagSupported(bytes32 flag) public view override returns (bool) {
        return supportedFlags.contains(flag);
    }

    /**
    * @dev Internal function to add new flag
    */
    function _addFlag(bytes32 flag, uint8 index) internal {
        require(!supportedFlagsMask.checkBit(index), "Index already used");
        require(!supportedFlags.contains(flag), "Flag already exist");

        flagIndexes[flag] = index;
        supportedFlags.add(flag);
        supportedFlagsMask = supportedFlagsMask.setBit(index);

        emit FlagAdded(flag, index);
    }

    /**
    * @dev Internal function to remove existing flag
    */
    function _removeFlag(bytes32 flag) internal {
        supportedFlags.remove(flag);
        uint8 _index = flagIndexes[flag];

        supportedFlagsMask = supportedFlagsMask.clearBit(_index);
        delete flagIndexes[flag];

        emit FlagRemoved(flag);
    }
}