// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {IFlagsStorage} from "./interfaces/IFlagsStorage.sol";
import {BitMask} from "./library/BitMask.sol";
import {Common__NotSuperAdmin, Common__MissingAccount} from "./library/CommonErrors.sol";

/**
 * @dev FlagsStorage is the main contract to store KYC-related flags for Gateway Token System.
 * KYC flags are identifiable by short identifiers in bytes32 strings. After adding flags
 * those bit indexes could be used by GatewayToken implementations to associate flags per token.
 */
contract FlagsStorage is Initializable, IFlagsStorage, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using Address for address;
    using BitMask for uint256;

    EnumerableSet.Bytes32Set private _supportedFlags;
    address public override superAdmin;

    uint256 public override supportedFlagsMask;

    mapping(bytes32 => uint8) public override flagIndexes;

    /// The flag being added already exists
    /// @param flag The flag being added
    error FlagsStorage__FlagAlreadyExists(bytes32 flag);

    /// The flag being removed does not exist
    /// @param flag The flag being removed
    error FlagsStorage__FlagNotSupported(bytes32 flag);

    /// Multiple flags updated but the number of flags passed in does not match the number of indexes
    /// @param expected The number of flags passed in
    /// @param actual The number of indexes passed in
    error FlagsStorage__IncorrectVariableLength(uint256 expected, uint256 actual);

    /// The flag index is already used
    /// @param index The flag index
    error FlagsStorage__IndexAlreadyUsed(uint8 index);

    // @dev Modifier to prevent calls from anyone except Identity.com Admin
    modifier onlySuperAdmin() {
        _onlySuperAdmin();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    // empty constructor in line with the UUPS upgradeable proxy pattern
    // solhint-disable-next-line no-empty-blocks
    constructor() initializer {}

    function initialize(address _superAdmin) public initializer {
        if (_superAdmin == address(0)) revert Common__MissingAccount();
        superAdmin = _superAdmin;
    }

    /**
     * @dev Triggers to transfer ownership of this contract to
     * new super admin, reverts on zero address and wallet addresses
     * @param newSuperAdmin New super admin contract address
     * @notice Only executed by existing super admin
     */
    function updateSuperAdmin(address newSuperAdmin) public override onlySuperAdmin {
        if (newSuperAdmin == address(0)) revert Common__MissingAccount();

        emit SuperAdminUpdated(superAdmin, newSuperAdmin);
        superAdmin = newSuperAdmin;
    }

    /**
     * @dev Triggers to add new flag into gateway token system
     * @param flag Flag short identifier
     * @param index Flag index (limited to 255)
     * @notice Only executed by existing DAO Manager
     */
    function addFlag(bytes32 flag, uint8 index) public override onlySuperAdmin {
        _addFlag(flag, index);
    }

    /**
     * @dev Triggers to add multiple flags into gateway token system
     * @param flags Array of flag short identifiers
     * @param indexes Array of flag indexes (limited to 255)
     * @notice Only executed by existing DAO Manager
     */
    function addFlags(bytes32[] memory flags, uint8[] memory indexes) public override onlySuperAdmin {
        if (flags.length != indexes.length) revert FlagsStorage__IncorrectVariableLength(flags.length, indexes.length);

        for (uint8 i = 0; i < flags.length; i++) {
            _addFlag(flags[i], indexes[i]);
        }
    }

    /**
     * @dev Triggers to remove existing flag from gateway token system
     * @param flag Flag short identifier
     * @notice Only executed by existing DAO Manager
     */
    function removeFlag(bytes32 flag) public override onlySuperAdmin {
        if (!_supportedFlags.contains(flag)) revert FlagsStorage__FlagNotSupported(flag);

        _removeFlag(flag);
    }

    /**
     * @dev Triggers to remove multiple existing flags from gateway token system
     * @param flags Array of flag short identifiers
     * @notice Only executed by existing DAO Manager
     */
    function removeFlags(bytes32[] memory flags) public override onlySuperAdmin {
        for (uint8 i = 0; i < flags.length; i++) {
            // additional check to reduce incorrect FlagRemoved events
            if (!_supportedFlags.contains(flags[i])) revert FlagsStorage__FlagNotSupported(flags[i]);

            _removeFlag(flags[i]);
        }
    }

    /**
     * @dev Triggers to check if a particular flag is supported
     * @param flag Flag short identifier
     * @return Boolean for flag support
     */
    function isFlagSupported(bytes32 flag) public view override returns (bool) {
        return _supportedFlags.contains(flag);
    }

    /**
     * @dev Internal function to add new flag
     */
    function _addFlag(bytes32 flag, uint8 index) internal {
        if (supportedFlagsMask.checkBit(index)) revert FlagsStorage__IndexAlreadyUsed(index);
        if (_supportedFlags.contains(flag)) revert FlagsStorage__FlagAlreadyExists(flag);

        flagIndexes[flag] = index;
        _supportedFlags.add(flag);
        supportedFlagsMask = supportedFlagsMask.setBit(index);

        emit FlagAdded(flag, index);
    }

    /**
     * @dev Internal function to remove existing flag
     */
    function _removeFlag(bytes32 flag) internal {
        _supportedFlags.remove(flag);
        uint8 _index = flagIndexes[flag];

        supportedFlagsMask = supportedFlagsMask.clearBit(_index);
        delete flagIndexes[flag];

        emit FlagRemoved(flag);
    }

    // includes the onlySuperAdmin modifier to ensure that only the super admin can call this function
    // otherwise, no other logic.
    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlySuperAdmin {}

    // separate into a private function to reduce code size
    function _onlySuperAdmin() private view {
        if (msg.sender != superAdmin) revert Common__NotSuperAdmin(msg.sender);
    }
}
