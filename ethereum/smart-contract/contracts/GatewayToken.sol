// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC3525MetadataUpgradeable} from "@solvprotocol/erc-3525/extensions/IERC3525MetadataUpgradeable.sol";
import {ERC3525Upgradeable} from "@solvprotocol/erc-3525/ERC3525Upgradeable.sol";
import {IERC721} from "@solvprotocol/erc-3525/IERC721.sol";
import {IERC3525} from "@solvprotocol/erc-3525/IERC3525.sol";
import {TokenBitMask} from "./TokenBitMask.sol";
import {IGatewayToken} from "./interfaces/IGatewayToken.sol";
import {IERC721Freezable} from "./interfaces/IERC721Freezable.sol";
import {IERC721Expirable} from "./interfaces/IERC721Expirable.sol";
import {IERC721Revokable} from "./interfaces/IERC721Revokable.sol";
import {MultiERC2771ContextUpgradeable} from "./MultiERC2771ContextUpgradeable.sol";
import {Charge} from "./library/Charge.sol";
import {ParameterizedAccessControl} from "./ParameterizedAccessControl.sol";
import {Common__MissingAccount, Common__NotContract, Common__Unauthorized} from "./library/CommonErrors.sol";
import {ChargeHandler} from "./ChargeHandler.sol";
import {BitMask} from "./library/BitMask.sol";
import {InternalTokenApproval} from "./library/InternalTokenApproval.sol";

/**
 * @dev Gateway Token contract is responsible for managing Identity.com KYC gateway tokens
 * those tokens represent completed KYC with attached identity.
 * Gateway tokens using ERC721 standard with custom extensions.
 *
 * Contract handles multiple levels of access such as Network Authority
 * (may represent a specific regulator body)
 * Gatekeepers (Identity.com network parties who can mint/burn/freeze gateway tokens)
 * and overall system Admin who can add
 * new Gatekeepers and Network Authorities
 */
contract GatewayToken is
    UUPSUpgradeable,
    MultiERC2771ContextUpgradeable,
    ERC3525Upgradeable,
    ParameterizedAccessControl,
    IERC721Freezable,
    IERC721Expirable,
    IERC721Revokable,
    IGatewayToken,
    TokenBitMask,
    ChargeHandler
{
    using Address for address;
    using Strings for uint;
    using BitMask for uint256;
    using InternalTokenApproval for mapping(address => InternalTokenApproval.Approval);

    enum NetworkFeature {
        // if set, gateway tokens are considered invalid if the gatekeeper that minted them is removed from the network
        // defaults to false, and can be set by the network authority.
        REMOVE_GATEKEEPER_INVALIDATES_TOKENS
    }

    // Off-chain DAO governance access control
    mapping(uint => bool) public isNetworkDAOGoverned;

    // Access control roles
    bytes32 public constant DAO_MANAGER_ROLE = keccak256("DAO_MANAGER_ROLE");
    bytes32 public constant GATEKEEPER_ROLE = keccak256("GATEKEEPER_ROLE");
    bytes32 public constant NETWORK_AUTHORITY_ROLE = keccak256("NETWORK_AUTHORITY_ROLE");

    // Mapping from token id to state
    mapping(uint => TokenState) internal _tokenStates;

    // Optional Mapping from token ID to expiration date
    mapping(uint => uint) internal _expirations;

    mapping(uint => string) internal _networks;

    // Specifies the gatekeeper that minted a given token
    mapping(uint => address) internal _issuingGatekeepers;

    // Mapping for gatekeeper network features
    mapping(uint => uint256) internal _networkFeatures;

    // Mapping of user addresses to their respective internal approval configurations
    // For more details, see lib/InternalTokenApproval.sol
    mapping(address => InternalTokenApproval.Approval) internal _approvals;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor is "empty" as we are using the proxy pattern,
    // where setup code is in the initialize function
    // called by the proxy contract
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string calldata _name,
        string calldata _symbol,
        address _superAdmin,
        address _flagsStorage,
        address[] calldata _trustedForwarders
    ) external initializer {
        // Check for zero addresses
        if (_superAdmin == address(0)) {
            revert Common__MissingAccount();
        }

        if (_flagsStorage == address(0)) {
            revert Common__MissingAccount();
        }

        // Check for zero addresses in the trusted forwarders array
        for (uint256 i = 0; i < _trustedForwarders.length; i++) {
            if (_trustedForwarders[i] == address(0)) {
                revert Common__MissingAccount();
            }
        }

        __ERC3525_init(_name, _symbol, 0);
        __MultiERC2771ContextUpgradeable_init(_trustedForwarders);

        _setFlagsStorage(_flagsStorage);
        _superAdmins[_superAdmin] = true;
    }

    function setMetadataDescriptor(address _metadataDescriptor) external onlySuperAdmin {
        _setMetadataDescriptor(_metadataDescriptor);
    }

    function addForwarder(address forwarder) external onlySuperAdmin {
        _addForwarder(forwarder);
    }

    function removeForwarder(address forwarder) external onlySuperAdmin {
        _removeForwarder(forwarder);
    }

    /**
     * @dev Triggers to update FlagsStorage contract address
     * @param flagsStorage FlagsStorage contract address
     */
    function updateFlagsStorage(address flagsStorage) external onlySuperAdmin {
        _setFlagsStorage(flagsStorage);
    }

    /**
     * @dev Triggers to burn gateway token
     * @param tokenId Gateway token id
     */
    function burn(uint tokenId) external virtual {
        _checkGatekeeper(slotOf(tokenId));
        _burn(tokenId);
    }

    /**
     * @dev Triggers to mint gateway token
     * @param to Gateway token owner
     * @param network Gateway token type
     * @param mask The bitmask for the token
     */
    function mint(
        address to,
        uint network,
        uint expiration,
        uint mask,
        Charge calldata charge
    ) external payable virtual {
        // CHECKS
        _checkGatekeeper(network);

        // EFFECTS
        uint tokenId = ERC3525Upgradeable._mint(to, network, 1);

        if (expiration > 0) {
            _expirations[tokenId] = expiration;
        }

        if (mask > 0) {
            _setBitMask(tokenId, mask);
        }

        _issuingGatekeepers[tokenId] = _msgSender();

        // INTERACTIONS
        _handleCharge(charge, network, _approvals);
    }

    function revoke(uint tokenId) external virtual override {
        _checkGatekeeper(slotOf(tokenId));

        _tokenStates[tokenId] = TokenState.REVOKED;

        emit Revoke(tokenId);
    }

    /**
     * @dev Triggers to freeze gateway token
     * @param tokenId Gateway token id
     */
    function freeze(uint tokenId) external virtual {
        _checkGatekeeper(slotOf(tokenId));

        _freeze(tokenId);
    }

    /**
     * @dev Triggers to unfreeze gateway token
     * @param tokenId Gateway token id
     */
    function unfreeze(uint tokenId) external virtual {
        _checkGatekeeper(slotOf(tokenId));

        _unfreeze(tokenId);
    }

    /**
     * @dev Triggers to set expiration for tokenId
     * @param tokenId Gateway token id
     * @param timestamp Expiration timestamp
     * @param charge Charge for the operation
     */
    function setExpiration(uint tokenId, uint timestamp, Charge calldata charge) external payable virtual {
        // CHECKS
        uint network = slotOf(tokenId);
        _checkGatekeeper(slotOf(tokenId));
        // EFFECTS
        _setExpiration(tokenId, timestamp);
        // INTERACTIONS
        _handleCharge(charge, network, _approvals);
    }

    /**
     * @dev Transfers Gateway Token DAO Manager access from `previousManager` to `newManager`
     * Only a current DAO Manager can do this. They can do this for any other DAO Manager.
     * This is useful for two reasons:
     * 1. Key rotation of the current (msg signer) DAO manager
     * 2. Replacing a lost or compromised key of an existing DAO manager
     * @param newManager Address to transfer DAO Manager role for.
     * @notice GatewayToken contract has to be DAO Governed
     */
    function transferDAOManager(address previousManager, address newManager, uint network) external {
        if (!isNetworkDAOGoverned[network]) revert GatewayToken__NotDAOGoverned(network);

        // check the previous manager is a current dao manager
        _checkRole(DAO_MANAGER_ROLE, network, previousManager);

        if (newManager == address(0)) revert Common__MissingAccount();

        // grant the new manager the relevant roles
        grantRole(DAO_MANAGER_ROLE, network, newManager);
        grantRole(NETWORK_AUTHORITY_ROLE, network, newManager);
        grantRole(GATEKEEPER_ROLE, network, newManager);

        // revoke the relevant roles from the previous manager
        revokeRole(GATEKEEPER_ROLE, network, previousManager);
        revokeRole(NETWORK_AUTHORITY_ROLE, network, previousManager);
        revokeRole(DAO_MANAGER_ROLE, network, previousManager);

        emit DAOManagerTransferred(previousManager, newManager, network);
    }

    function createNetwork(uint network, string calldata name, bool daoGoverned, address daoManager) external virtual {
        if (bytes(_networks[network]).length != 0) {
            revert GatewayToken__NetworkAlreadyExists(network);
        }

        _networks[network] = name;

        if (daoGoverned) {
            isNetworkDAOGoverned[network] = daoGoverned;

            if (daoManager == address(0)) {
                revert Common__MissingAccount();
            }
            if (!daoManager.isContract()) {
                revert Common__NotContract(daoManager);
            }

            // use the internal function to avoid the check for the network authority role
            // since this network does not exist yet, it has no existing network authority
            _grantRole(DAO_MANAGER_ROLE, network, daoManager);
            _grantRole(NETWORK_AUTHORITY_ROLE, network, daoManager);

            // DAO managers can assign and revoke network authorities and gatekeepers
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, DAO_MANAGER_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, DAO_MANAGER_ROLE);
            // DAO Managers can administrate themselves
            _setRoleAdmin(DAO_MANAGER_ROLE, network, DAO_MANAGER_ROLE);
        } else {
            // use the internal function to avoid the check for the network authority role
            // since this network does not exist yet, it has no existing network authority
            _grantRole(NETWORK_AUTHORITY_ROLE, network, _msgSender());

            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, NETWORK_AUTHORITY_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, NETWORK_AUTHORITY_ROLE);
        }
    }

    function renameNetwork(uint network, string calldata name) external virtual {
        if (bytes(_networks[network]).length == 0) {
            revert GatewayToken__NetworkDoesNotExist(network);
        }
        if (!hasRole(NETWORK_AUTHORITY_ROLE, network, _msgSender())) {
            revert Common__Unauthorized(_msgSender(), network, NETWORK_AUTHORITY_ROLE);
        }

        _networks[network] = name;
    }

    /**
     * @dev Triggers to add new gatekeeper into the system.
     * @param gatekeeper Gatekeeper address
     */
    function addGatekeeper(address gatekeeper, uint network) external virtual {
        grantRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
     * @dev Triggers to remove existing gatekeeper from gateway token.
     * @param gatekeeper Gatekeeper address
     */
    function removeGatekeeper(address gatekeeper, uint network) external virtual {
        revokeRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
     * @dev Triggers to add new network authority into the system.
     * @param authority Network Authority address
     *
     * @notice Can be triggered by DAO Manager or any Network Authority
     */
    function addNetworkAuthority(address authority, uint network) external virtual {
        grantRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
     * @dev Triggers to remove existing network authority from gateway token.
     * @param authority Network Authority address
     *
     * @notice Can be triggered by DAO Manager or any Network Authority
     */
    function removeNetworkAuthority(address authority, uint network) external virtual {
        revokeRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
     * @dev Triggers to set full bitmask for gateway token with `tokenId`
     */
    function setBitmask(uint tokenId, uint mask) external virtual {
        _checkSenderRole(GATEKEEPER_ROLE, slotOf(tokenId));
        _setBitMask(tokenId, mask);
    }

    function setNetworkFeatures(uint network, uint256 mask) external virtual {
        _checkSenderRole(NETWORK_AUTHORITY_ROLE, network);
        _networkFeatures[network] = mask;
    }

    function getNetwork(uint network) external view virtual returns (string memory) {
        return _networks[network];
    }

    function getIssuingGatekeeper(uint tokenId) external view virtual returns (address) {
        return _issuingGatekeepers[tokenId];
    }

    function getTokenIdsByOwnerAndNetwork(
        address owner,
        uint network,
        bool onlyActive
    ) external view virtual returns (uint[] memory) {
        (uint[] memory tokenIds, uint count) = _getTokenIdsByOwnerAndNetwork(owner, network, onlyActive);
        uint[] memory tokenIdsResized = new uint[](count);

        for (uint i = 0; i < count; i++) {
            tokenIdsResized[i] = tokenIds[i];
        }

        return tokenIdsResized;
    }

    /**
     * @dev Triggered by external contract to verify the validity of the default token for `owner`.
     *
     * Checks owner has any token on gateway token contract, `tokenId` still active, and not expired.
     */
    function verifyToken(address owner, uint network) external view virtual returns (bool) {
        (, uint count) = _getTokenIdsByOwnerAndNetwork(owner, network, true);

        return count > 0;
    }

    /**
     * @dev Triggered by external contract to verify the validity of the default token for `owner`.
     *
     * Checks owner has any token on gateway token contract, `tokenId` still active, and not expired.
     */
    function verifyToken(uint tokenId) external view virtual returns (bool) {
        return _existsAndActive(tokenId, false);
    }

    /**
     * @dev Triggers to get all information gateway token related to specified `tokenId`
     * @param tokenId Gateway token id
     */
    function getToken(
        uint tokenId
    )
        external
        view
        virtual
        returns (address owner, uint8 state, string memory identity, uint expiration, uint bitmask)
    {
        owner = ownerOf(tokenId);
        state = uint8(_tokenStates[tokenId]);
        expiration = _expirations[tokenId];
        bitmask = _getBitMask(tokenId);

        return (owner, state, identity, expiration, bitmask);
    }

    /**
     * @dev Triggers to get specified `tokenId` expiration timestamp
     * @param tokenId Gateway token id
     */
    function getExpiration(uint tokenId) external view virtual returns (uint) {
        _checkTokenExists(tokenId);

        return _expirations[tokenId];
    }

    /**
     * @dev Triggers to verify if address has a GATEKEEPER role.
     * @param gatekeeper Gatekeeper address
     */
    function isGatekeeper(address gatekeeper, uint network) external view virtual returns (bool) {
        return hasRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
     * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role.
     * @param authority Network Authority address
     */
    function isNetworkAuthority(address authority, uint network) external view virtual returns (bool) {
        return hasRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
     * @dev Triggers to get gateway token bitmask
     */
    function getTokenBitmask(uint tokenId) external view virtual returns (uint) {
        return _getBitMask(tokenId);
    }

    /**
     * @dev Returns true if gateway token owner transfers restricted, and false otherwise.
     */
    function transfersRestricted() external pure virtual returns (bool) {
        return true;
    }

    /**
     * @dev Transfers are disabled for Gateway Tokens - override ERC3525 approve functions to revert
     * Note - transferFrom and safeTransferFrom are disabled indirectly with the _isApprovedOrOwner function
     */
    function approve(uint256, address, uint256) public payable virtual override {
        revert GatewayToken__TransferDisabled();
    }

    function approve(address, uint256) public payable virtual override {
        revert GatewayToken__TransferDisabled();
    }

    function setApproval(uint256 _tokens, uint256 _network) public {
        _approvals.setApproval(msg.sender, _tokens, _network);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC3525Upgradeable, ParameterizedAccessControl) returns (bool) {
        return
            interfaceId == type(IERC3525).interfaceId ||
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC3525MetadataUpgradeable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    function networkHasFeature(uint network, NetworkFeature feature) public view virtual returns (bool) {
        return _networkFeatures[network].checkBit(uint8(feature));
    }

    /**
     * @dev Freezes `tokenId` and it's usage by gateway token owner.
     *
     * Emits a {Freeze} event.
     */
    function _freeze(uint tokenId) internal virtual {
        _checkActiveToken(tokenId, true);

        _tokenStates[tokenId] = TokenState.FROZEN;

        emit Freeze(tokenId);
    }

    /**
     * @dev Unfreezes `tokenId` and it's usage by gateway token owner.
     *
     * Emits a {Unfreeze} event.
     */
    function _unfreeze(uint tokenId) internal virtual {
        _checkTokenExists(tokenId);
        if (_tokenStates[tokenId] != TokenState.FROZEN) {
            revert GatewayToken__TokenInvalidStateForOperation(tokenId, _tokenStates[tokenId], TokenState.FROZEN);
        }

        _tokenStates[tokenId] = TokenState.ACTIVE;

        emit Unfreeze(tokenId);
    }

    /**
     * @dev Sets expiration time for `tokenId`.
     */
    function _setExpiration(uint tokenId, uint timestamp) internal virtual {
        _checkActiveToken(tokenId, true);

        _expirations[tokenId] = timestamp;
        emit Expiration(tokenId, timestamp);
    }

    // includes the onlySuperAdmin modifier to ensure that only the super admin can call this function
    // otherwise, no other logic.
    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlySuperAdmin {}

    function _msgSender()
        internal
        view
        virtual
        override(MultiERC2771ContextUpgradeable, ContextUpgradeable)
        returns (address sender)
    {
        return MultiERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(MultiERC2771ContextUpgradeable, ContextUpgradeable)
        returns (bytes calldata)
    {
        return MultiERC2771ContextUpgradeable._msgData();
    }

    function _getTokenIdsByOwnerAndNetwork(
        address owner,
        uint network,
        bool onlyActive
    ) internal view returns (uint[] memory, uint) {
        uint length = balanceOf(owner);
        uint[] memory tokenIds = new uint[](length);
        uint count = 0;

        for (uint i = 0; i < length; i++) {
            uint tokenId = tokenOfOwnerByIndex(owner, i);
            if (slotOf(tokenId) == network && (!onlyActive || _existsAndActive(tokenId, false))) {
                tokenIds[count++] = tokenId;
            }
        }

        return (tokenIds, count);
    }

    /**
     * @dev Returns whether `tokenId` exists and not frozen.
     */
    function _existsAndActive(uint tokenId, bool allowExpired) internal view virtual returns (bool) {
        // check state before anything else. This reduces the overhead,
        // and avoids a revert, if the token does not exist.
        TokenState state = _tokenStates[tokenId];
        if (state != TokenState.ACTIVE) return false;

        // if the network has the REMOVE_GATEKEEPER_INVALIDATES_TOKENS feature,
        // check that the gatekeeper is still in the gatekeeper network.
        // tokens issued without gatekeepers are exempt.
        uint network = slotOf(tokenId);
        if (networkHasFeature(network, NetworkFeature.REMOVE_GATEKEEPER_INVALIDATES_TOKENS)) {
            address gatekeeper = _issuingGatekeepers[tokenId];
            if (gatekeeper != address(0) && !hasRole(GATEKEEPER_ROLE, network, gatekeeper)) {
                return false;
            }
        }

        address owner = ownerOf(tokenId);
        if (_expirations[tokenId] != 0 && !allowExpired) {
            return owner != address(0) && block.timestamp <= _expirations[tokenId];
        } else {
            return owner != address(0);
        }
    }

    function _isApprovedOrOwner(address, uint) internal view virtual override returns (bool) {
        return false; // transfers are restricted, so this can never pass
    }

    /// @dev Checks if the sender has the specified role on the specified network and revert otherwise
    function _checkSenderRole(bytes32 role, uint network) internal view {
        _checkRole(role, network, _msgSender());
    }

    function _checkGatekeeper(uint network) internal view {
        _checkSenderRole(GATEKEEPER_ROLE, network);
    }

    /// @dev Checks if the token exists and is active. Optionally ignore expiry.
    /// Use this when you need to check if a token exists, and is not frozen or revoked
    /// But you don't care about its expiry, e.g. you are extending the expiry.
    function _checkActiveToken(uint tokenId, bool allowExpired) internal view {
        if (!_existsAndActive(tokenId, allowExpired)) {
            revert GatewayToken__TokenDoesNotExistOrIsInactive(tokenId, allowExpired);
        }
    }

    /// @dev Checks if the token exists - ignore if it is active or not.
    function _checkTokenExists(uint tokenId) internal view {
        if (!_exists(tokenId)) {
            revert GatewayToken__TokenDoesNotExist(tokenId);
        }
    }
}
