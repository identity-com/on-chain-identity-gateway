// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@solvprotocol/erc-3525/ERC3525Upgradeable.sol";
import "@solvprotocol/erc-3525/IERC3525.sol";
import "./TokenBitMask.sol";
import "./interfaces/IERC721Freezable.sol";
import "./interfaces/IGatewayToken.sol";
import "./interfaces/IERC721Expirable.sol";
import "./interfaces/IERC721Revokable.sol";
import "./MultiERC2771Context.sol";
import "./library/Charge.sol";
import "./ParameterizedAccessControl.sol";


/**
 * @dev A copy of GatewayToken.sol, used to test the upgradeability of the contract.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only
 */
contract GatewayTokenUpgradeTest is
UUPSUpgradeable,
MultiERC2771Context,
ERC3525Upgradeable,
ParameterizedAccessControl,
IERC721Freezable,
IERC721Expirable,
IERC721Revokable,
IGatewayToken,
TokenBitMask
{
    /**
    * @dev A changed version of mint() in the GatewayToken contract which enforces non-zero expiry
    * @param to Gateway token owner
    * @param network Gateway token type
    * @param mask The bitmask for the token
    */
    function mint(address to, uint256 network, uint256 expiration, uint256 mask, Charge calldata) public virtual {
        _checkGatekeeper(network);

        uint256 tokenId = ERC3525Upgradeable._mint(to, network, 1);

        // THIS IS THE ONLY CHANGE IN THE CONTRACT COMPARED TO GatewayToken.sol
        // Enforces positive expiry times i.e. cannot set to zero
        // This is just to test the upgrade feature
        require(expiration > 0, "TEST MODE: Expiry must be greater than zero");

        expirations[tokenId] = expiration;

        if (mask > 0) {
            _setBitMask(tokenId, mask);
        }
    }

    using Address for address;
    using Strings for uint;

    // Gateway Token controller contract address
    address public controller;

    // Off-chain DAO governance access control
    mapping(uint => bool) public isNetworkDAOGoverned;

    // Access control roles
    bytes32 public constant DAO_MANAGER_ROLE = keccak256("DAO_MANAGER_ROLE");
    bytes32 public constant GATEKEEPER_ROLE = keccak256("GATEKEEPER_ROLE");
    bytes32 public constant NETWORK_AUTHORITY_ROLE = keccak256("NETWORK_AUTHORITY_ROLE");

    // Optional mapping for gateway token bitmaps
    mapping(uint => TokenState) private tokenStates;

    // Optional Mapping from token ID to expiration date
    mapping(uint => uint) private expirations;

    mapping(uint => string) private networks;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        string memory _name,
        string memory _symbol,
        address _superAdmin,
        address _flagsStorage,
        address[] memory _trustedForwarders
    ) initializer public {
        __ERC3525_init(_name, _symbol, 0);
        __MultiERC2771Context_init(_trustedForwarders);

        _setFlagsStorage(_flagsStorage);
        _superAdmins[_superAdmin] = true;
    }

    function setMetadataDescriptor(address _metadataDescriptor) public onlySuperAdmin {
        _setMetadataDescriptor(_metadataDescriptor);
    }

    function _msgSender() internal view virtual override(MultiERC2771Context, ContextUpgradeable) returns (address sender) {
        return MultiERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(MultiERC2771Context, ContextUpgradeable) returns (bytes calldata) {
        return MultiERC2771Context._msgData();
    }

    function addForwarder(address forwarder) public override(MultiERC2771Context) onlySuperAdmin {
        super.addForwarder(forwarder);
    }

    function removeForwarder(address forwarder) public override(MultiERC2771Context) onlySuperAdmin {
        super.removeForwarder(forwarder);
    }

    // if any funds are sent to this contract, use this function to withdraw them
    function withdraw(uint amount) onlySuperAdmin external returns(bool) {
        if (amount > address(this).balance) {
            revert GatewayToken__InsufficientFunds(address(this).balance, amount);
        }

        payable(_msgSender()).transfer(amount);
        return true;

    }

    /**
     * @dev Returns true if gateway token owner transfers restricted, and false otherwise.
     */
    function transfersRestricted() public view virtual returns (bool) {
        return true;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC3525Upgradeable, ParameterizedAccessControl) returns (bool) {
        return
        interfaceId == type(IERC3525).interfaceId ||
        interfaceId == type(IERC721).interfaceId ||
        interfaceId == type(IERC3525MetadataUpgradeable).interfaceId ||
        super.supportsInterface(interfaceId);
    }

    function createNetwork(uint network, string memory name, bool daoGoverned, address daoManager) external virtual {
        if (bytes(networks[network]).length != 0) {
            revert GatewayToken__NetworkAlreadyExists(network);
        }

        networks[network] = name;

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
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, DAO_MANAGER_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, DAO_MANAGER_ROLE);
        } else {
            // use the internal function to avoid the check for the network authority role
            // since this network does not exist yet, it has no existing network authority
            _grantRole(NETWORK_AUTHORITY_ROLE, network, _msgSender());

            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, NETWORK_AUTHORITY_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, NETWORK_AUTHORITY_ROLE);
        }
    }

    function renameNetwork(uint network, string memory name) external virtual {
        if (bytes(networks[network]).length == 0) {
            revert GatewayToken__NetworkDoesNotExist(network);
        }
        if (!hasRole(NETWORK_AUTHORITY_ROLE, network, _msgSender())) {
            revert Common__Unauthorized(_msgSender(), network, NETWORK_AUTHORITY_ROLE);
        }

        networks[network] = name;
    }

    function getNetwork(uint network) public view virtual returns (string memory) {
        return networks[network];
    }

    function _getTokenIdsByOwnerAndNetwork(address owner, uint network) internal view returns (uint[] memory, uint) {
        uint[] memory tokenIds = new uint[](balanceOf(owner));
        uint count = 0;
        for (uint i = 0; i < tokenIds.length; i++) {
            uint tokenId = tokenOfOwnerByIndex(owner, i);
            if (slotOf(tokenId) == network) {
                tokenIds[count++] = tokenId;
            }
        }
        return (tokenIds, count);
    }

    function getTokenIdsByOwnerAndNetwork(address owner, uint network) external view returns (uint[] memory) {
        (uint[] memory tokenIds, uint count) = _getTokenIdsByOwnerAndNetwork(owner, network);
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
        (uint[] memory tokenIds, uint count) = _getTokenIdsByOwnerAndNetwork(owner, network);

        for (uint i = 0; i < count; i++) {
            if (tokenIds[i] != 0) {
                if (_existsAndActive(tokenIds[i], false)) return true;
            }
        }

        return false;
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
    function getToken(uint tokenId) public view virtual override
    returns (
        address owner,
        uint8 state,
        string memory identity,
        uint expiration,
        uint bitmask
    )
    {
        owner = ownerOf(tokenId);
        state = uint8(tokenStates[tokenId]);
        expiration = expirations[tokenId];
        bitmask = _getBitMask(tokenId);

        return (owner, state, identity, expiration, bitmask);
    }

    /**
    * @dev Returns whether `tokenId` exists and not frozen.
    */
    function _existsAndActive(uint tokenId, bool allowExpired) internal view virtual returns (bool) {
        // check state before anything else. This reduces the overhead, and avoids a revert, if the token does not exist.
        TokenState state = tokenStates[tokenId];
        if (state != TokenState.ACTIVE) return false;

        address owner = ownerOf(tokenId);
        if (expirations[tokenId] != 0 && !allowExpired) {
            return owner != address(0) && block.timestamp <= expirations[tokenId];
        } else {
            return owner != address(0);
        }
    }

    function _isApprovedOrOwner(address, uint) internal view virtual override returns (bool) {
        return false;   // transfers are restricted, so this can never pass
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

    /**
    * @dev Triggers to burn gateway token
    * @param tokenId Gateway token id
    */
    function burn(uint tokenId) public virtual {
        _checkGatekeeper(slotOf(tokenId));
        _burn(tokenId);
    }

    function revoke(uint tokenId) public virtual override {
        _checkGatekeeper(slotOf(tokenId));

        tokenStates[tokenId] = TokenState.REVOKED;

        emit Revoke(tokenId);
    }

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function freeze(uint tokenId) public virtual override {
        _checkGatekeeper(slotOf(tokenId));

        _freeze(tokenId);
    }

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    */
    function unfreeze(uint tokenId) public virtual override {
        _checkGatekeeper(slotOf(tokenId));

        _unfreeze(tokenId);
    }


    /**
    * @dev Triggers to get specified `tokenId` expiration timestamp
    * @param tokenId Gateway token id
    */
    function getExpiration(uint tokenId) public view virtual override returns (uint) {
        _checkTokenExists(tokenId);

        return expirations[tokenId];
    }

    /**
    * @dev Triggers to set expiration for tokenId
    * @param tokenId Gateway token id
    */
    function setExpiration(uint tokenId, uint timestamp, Charge calldata) public virtual override {
        _checkGatekeeper(slotOf(tokenId));

        _setExpiration(tokenId, timestamp);
    }

    /**
    * @dev Freezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Freeze} event.
    */
    function _freeze(uint tokenId) internal virtual {
        _checkActiveToken(tokenId, true);

        tokenStates[tokenId] = TokenState.FROZEN;

        emit Freeze(tokenId);
    }

    /**
    * @dev Unfreezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Unfreeze} event.
    */
    function _unfreeze(uint tokenId) internal virtual {
        _checkTokenExists(tokenId);
        if (tokenStates[tokenId] != TokenState.FROZEN) {
            revert GatewayToken__TokenInvalidStateForOperation(tokenId, tokenStates[tokenId], TokenState.FROZEN);
        }

        tokenStates[tokenId] = TokenState.ACTIVE;

        emit Unfreeze(tokenId);
    }

    /**
    * @dev Sets expiration time for `tokenId`.
    */
    function _setExpiration(uint tokenId, uint timestamp) internal virtual {
        _checkActiveToken(tokenId, true);

        expirations[tokenId] = timestamp;
        emit Expiration(tokenId, timestamp);
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint tokenId
    ) internal virtual {}

    // ===========  ACCESS CONTROL SECTION ============

    /**
    * @dev Triggers to add new gatekeeper into the system.
    * @param gatekeeper Gatekeeper address
    */
    function addGatekeeper(address gatekeeper, uint network) public virtual {
        grantRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to remove existing gatekeeper from gateway token.
    * @param gatekeeper Gatekeeper address
    */
    function removeGatekeeper(address gatekeeper, uint network) public virtual {
        revokeRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to verify if address has a GATEKEEPER role.
    * @param gatekeeper Gatekeeper address
    */
    function isGatekeeper(address gatekeeper, uint network) external view virtual override returns (bool) {
        return hasRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to add new network authority into the system.
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function addNetworkAuthority(address authority, uint network) external virtual override {
        grantRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
    * @dev Triggers to remove existing network authority from gateway token.
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function removeNetworkAuthority(address authority, uint network) external virtual override {
        revokeRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
    * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role.
    * @param authority Network Authority address
    */
    function isNetworkAuthority(address authority, uint network) external view virtual override returns (bool) {
        return hasRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    // ===========  ACCESS CONTROL SECTION ============

    /**
    * @dev Transfers Gateway Token DAO Manager access from `previousManager` to `newManager`
    * Only a current DAO Manager can do this. They can do this for any other DAO Manager.
    * This is useful for two reasons:
    * 1. Key rotation of the current (msg signer) DAO manager
    * 2. Replacing a lost or compromised key of an existing DAO manager
    * @param newManager Address to transfer DAO Manager role for.
    * @notice GatewayToken contract has to be DAO Governed
    */
    function transferDAOManager(address previousManager, address newManager, uint network) public override {
        if (!isNetworkDAOGoverned[network]) revert GatewayToken__NotDAOGoverned(network);

        // check the previous manager is a current dao manager
        _checkRole(DAO_MANAGER_ROLE, network, previousManager);
        // check the new manager is a dao manager
        _checkRole(DAO_MANAGER_ROLE, network, _msgSender());

        if (newManager == address(0)) revert Common__MissingAccount();

        grantRole(DAO_MANAGER_ROLE, network, newManager);
        grantRole(NETWORK_AUTHORITY_ROLE, network, newManager);
        grantRole(GATEKEEPER_ROLE, network, newManager);

        revokeRole(GATEKEEPER_ROLE, network, previousManager);
        revokeRole(NETWORK_AUTHORITY_ROLE, network, previousManager);
        revokeRole(DAO_MANAGER_ROLE, network, previousManager);

        emit DAOManagerTransferred(previousManager, newManager, network);
    }

    // ===========  TOKEN BITMASK SECTION ============

    /**
    * @dev Triggers to update FlagsStorage contract address
    * @param flagsStorage FlagsStorage contract address
    */
    function updateFlagsStorage(address flagsStorage) public onlySuperAdmin {
        _setFlagsStorage(flagsStorage);
    }

    /**
    * @dev Triggers to get gateway token bitmask
    */
    function getTokenBitmask(uint tokenId) public view returns (uint) {
        return _getBitMask(tokenId);
    }

    /**
    * @dev Triggers to set full bitmask for gateway token with `tokenId`
    */
    function setBitmask(uint tokenId, uint mask) public {
        _checkSenderRole(GATEKEEPER_ROLE, slotOf(tokenId));
        _setBitMask(tokenId, mask);
    }

    function _authorizeUpgrade(address) internal override onlySuperAdmin {}
}