// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./interfaces/IGatewayTokenController.sol";
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
    address public override daoController;

    uint256 public override supportedFlagsMask;
    uint256 public override unsupportedFlagsMask;

    mapping(bytes32 => uint8) public override flagIndexes;

    // @dev Modifier to prevent calls from anyone except Identity.com Admin
    modifier onlyDAOController() {
        require(msg.sender == daoController, "NOT DAO ADDRESS");
        _;
    }

    constructor(address _daoController) public {
        // require(_daoController.isContract(), "DAO CONTROLLER IS NOT A CONTRACT");
        daoController = _daoController;
    }

    /**
    * @dev Triggers to transfer ownership of this contract to new DAO Controller, reverts on zero address and wallet addresses
    * @param _newDAOController New DAO Controller contract address
    * @notice Only executed by existing DAO Manager
    */
    function updateDAOManager(address _newDAOController) onlyDAOController public override {
        require(_newDAOController != address(0), "NEW DAO CONTROLLER IS ZERO ADDRESS");
        require(_newDAOController.isContract(), "NEW DAO CONTROLLER IS NOT A CONTRACT");

        emit DAOControllerUpdated(daoController, _newDAOController);
        daoController = _newDAOController;
    }

    /**
    * @dev Triggers to add new flag into gateway token system
    * @param _flag Flag short identifier
    * @param _index Flag index (limited to 255)
    * @notice Only executed by existing DAO Manager
    */
    function addFlag(bytes32 _flag, uint8 _index) onlyDAOController public override {
        _addFlag(_flag, _index);
    }

    /**
    * @dev Triggers to add multiple flags into gateway token system
    * @param _flags Array of flag short identifiers
    * @param _indexes Array of flag indexes (limited to 255)
    * @notice Only executed by existing DAO Manager
    */
    function addFlags(bytes32[] memory _flags, uint8[] memory _indexes) onlyDAOController public override {
        require(_flags.length == _indexes.length, "Incorect variables length");

        for (uint8 i = 0; i < _flags.length; i++) {
            _addFlag(_flags[i], _indexes[i]);
        }
    }

    /**
    * @dev Triggers to remove existing flag from gateway token system
    * @param _flag Flag short identifier
    * @notice Only executed by existing DAO Manager
    */
    function removeFlag(bytes32 _flag) onlyDAOController public override {
        require(supportedFlags.contains(_flag), "Flag not supported"); // additional check to reduce incorrect FlagRemoved event

        _removeFlag(_flag);
    }

    /**
    * @dev Triggers to remove multiple existing flags from gateway token system
    * @param _flags Array of flag short identifiers
    * @notice Only executed by existing DAO Manager
    */
    function removeFlags(bytes32[] memory _flags) onlyDAOController public override {
        for (uint8 i = 0; i < _flags.length; i++) {
            require(supportedFlags.contains(_flags[i]), "Flag not supported"); // additional check to reduce incorrect FlagRemoved events

            _removeFlag(_flags[i]);
        }
    }

    /**
    * @dev Triggers to check if a particular flag is supported
    * @param _flag Flag short identifier
    * @return Boolean for flag support
    */
    function isFlagSupported(bytes32 _flag) public view override returns (bool) {
        return supportedFlags.contains(_flag);
    }

    /**
    * @dev Triggers to check if several flags are supported
    * @param _flags Array of flags
    * @return Array of booleans with support per flag
    */
    function isFlagsSupported(bytes32[] memory _flags) public view override returns (bool[] memory) {
        uint len = _flags.length;
        bool[] memory result = new bool[](len);

        for (uint8 i = 0; i < _flags.length; i++) {
            result[i] = supportedFlags.contains(_flags[i]);
        }

        return result;
    }

    /**
    * @dev Internal function to add new flag
    */
    function _addFlag(bytes32 _flag, uint8 _index) internal {
        require(!supportedFlagsMask.checkBit(_index), "Index already used");
        require(!supportedFlags.contains(_flag), "Flag already exist");

        if (unsupportedFlagsMask.checkBit(_index)) {
            unsupportedFlagsMask = unsupportedFlagsMask.clearBit(_index);
        }

        flagIndexes[_flag] = _index;
        supportedFlags.add(_flag);
        supportedFlagsMask = supportedFlagsMask.setBit(_index);

        emit FlagAdded(_flag, _index);
    }

    /**
    * @dev Internal function to remove existing flag
    */
    function _removeFlag(bytes32 _flag) internal {
        supportedFlags.remove(_flag);
        uint8 _index = flagIndexes[_flag];

        supportedFlagsMask = supportedFlagsMask.clearBit(_index);
        unsupportedFlagsMask = unsupportedFlagsMask.setBit(_index);
        delete flagIndexes[_flag];

        emit FlagRemoved(_flag);
    }
}