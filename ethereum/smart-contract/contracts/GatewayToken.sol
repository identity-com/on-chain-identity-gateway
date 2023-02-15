// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@solvprotocol/erc-3525/ERC3525.sol";
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
 * @dev Gateway Token contract is responsible for managing Identity.com KYC gateway tokens 
 * those tokens represent completed KYC with attached identity. 
 * Gateway tokens using ERC721 standard with custom extentions.
 *
 * Contract handles multiple levels of access such as Network Authority (may represent a specific regulator body) 
 * Gatekeepers (Identity.com network parties who can mint/burn/freeze gateway tokens) and overall system Admin who can add
 * new Gatekeepers and Network Authorities
 */
contract GatewayToken is
MultiERC2771Context,
ERC3525,
ParameterizedAccessControl,
IERC721Freezable,
IERC721Expirable,
IERC721Revokable,
IGatewayToken,
TokenBitMask
{
    using Address for address;
    using Strings for uint256;

    enum TokenState {
        ACTIVE, FROZEN, REVOKED
    }

    // Gateway Token controller contract address
    address public controller;

    // Gateway token transfer restrictions
    bool public isTransfersRestricted;

    // Off-chain DAO governance access control
    mapping(uint256 => bool) public isNetworkDAOGoverned;

    // Access control roles
    bytes32 public constant DAO_MANAGER_ROLE = keccak256("DAO_MANAGER_ROLE");
    bytes32 public constant GATEKEEPER_ROLE = keccak256("GATEKEEPER_ROLE");
    bytes32 public constant NETWORK_AUTHORITY_ROLE = keccak256("NETWORK_AUTHORITY_ROLE");

    // Optional mapping for gateway token Identities (via TokenURI)
    mapping(uint256 => string) private tokenURIs;

    // Optional mapping for gateway token bitmaps
    mapping(uint256 => TokenState) private tokenStates;

    // Optional Mapping from token ID to expiration date
    mapping(uint256 => uint256) private expirations;

    mapping(uint256 => string) private networks;

    // @dev Modifier to make a function callable only when token transfers not restricted.
    modifier whenTransfersNotRestricted() {
        require(!transfersRestricted(), "TRANSFERS RESTRICTED");
        _;
    }

    // @dev Modifier to make a function callable only when token transfers restricted.
    modifier whenTransfersRestricted() {
        require(transfersRestricted(), "TRANSFERS NOT RESTRICTED");
        _;
    }

    /**
     * @dev Gateway Token constructor initializes the contract by 
     * setting a `name` and a `symbol` to the gateway token.
     *
     * Initiates gateway token roles with main system admin,
     * `NETWORK_AUTHORITY_ROLE` responsible for adding/removing Gatekeepers and 
     * `GATEKEEPER_ROLE` responsible for minting/burning/transferring tokens
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _superAdmin,
        address _flagsStorage,
        address[] memory _trustedForwarders
    )
    MultiERC2771Context(_trustedForwarders)
    ERC3525(_name, _symbol, 0) {
        isTransfersRestricted = true;
        _setFlagsStorage(_flagsStorage);
        _superAdmins[_superAdmin] = true;
    }

    function _msgSender() internal view virtual override(MultiERC2771Context, Context) returns (address sender) {
        return MultiERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(MultiERC2771Context, Context) returns (bytes calldata) {
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
        require(amount <= address(this).balance, "INSUFFICIENT FUNDS");
        payable(_msgSender()).transfer(amount);
        return true;

    }

    /**
     * @dev Returns true if gateway token owner transfers restricted, and false otherwise.
     */
    function transfersRestricted() public view virtual returns (bool) {
        return isTransfersRestricted;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC3525, ParameterizedAccessControl) returns (bool) {
        return
        interfaceId == type(IERC3525).interfaceId ||
        interfaceId == type(IERC721).interfaceId ||
        interfaceId == type(IERC721Metadata).interfaceId ||
        super.supportsInterface(interfaceId);
    }

    function createNetwork(uint256 network, string memory name, bool daoGoverned, address daoManager) external virtual {
        require(bytes(networks[network]).length == 0, "NETWORK ALREADY EXISTS");

        networks[network] = name;

        _setupRole(NETWORK_AUTHORITY_ROLE, network, _msgSender());

        if (daoGoverned) {
            isNetworkDAOGoverned[network] = daoGoverned;

            require(daoManager != address(0), "INCORRECT ADDRESS");
            // require(daoManager.isContract(), "NON CONTRACT EXECUTOR"); uncomment while testing with Gnosis Multisig

            _setupRole(DAO_MANAGER_ROLE, network, daoManager);
            _setupRole(NETWORK_AUTHORITY_ROLE, network, daoManager);
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, DAO_MANAGER_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, DAO_MANAGER_ROLE);
        } else {
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, network, NETWORK_AUTHORITY_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, network, NETWORK_AUTHORITY_ROLE);
        }
    }

    function renameNetwork(uint256 network, string memory name) external virtual {
        require(bytes(networks[network]).length != 0, "NETWORK DOES NOT EXIST");
        require(hasRole(NETWORK_AUTHORITY_ROLE, network, _msgSender()), "NOT AUTHORIZED");

        networks[network] = name;
    }

    /**
    * @dev Triggers to get identity attached to specific gateway token
    * @param tokenId Gateway token id
    */
    function getIdentity(uint256 tokenId) public view virtual returns (string memory) {
        return tokenURI(tokenId);
    }

    function getNetwork(uint256 network) public view virtual returns (string memory) {
        return networks[network];
    }

    function _getTokenIdsByOwnerAndNetwork(address owner, uint256 network) internal view returns (uint256[] memory, uint256) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 count = 0;
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (slotOf(tokenId) == network) {
                tokenIds[count++] = tokenId;
            }
        }
        return (tokenIds, count);
    }

    function getTokenIdsByOwnerAndNetwork(address owner, uint256 network) external view returns (uint256[] memory) {
        (uint256[] memory tokenIds, uint256 count) = _getTokenIdsByOwnerAndNetwork(owner, network);
        uint256[] memory tokenIdsResized = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIdsResized[i] = tokenIds[i];
        }
        return tokenIdsResized;
    }

    /**
    * @dev Triggered by external contract to verify the validity of the default token for `owner`.
    *
    * Checks owner has any token on gateway token contract, `tokenId` still active, and not expired.
    */
    function verifyToken(address owner, uint256 network) external view virtual returns (bool) {
        (uint256[] memory tokenIds, uint256 count) = _getTokenIdsByOwnerAndNetwork(owner, network);

        for (uint256 i = 0; i < count; i++) {
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
    function verifyToken(uint256 tokenId) external view virtual returns (bool) {
        return _existsAndActive(tokenId, false);
    }

    /**
    * @dev Triggers to get all information gateway token related to specified `tokenId`
    * @param tokenId Gateway token id
    */
    function getToken(uint256 tokenId) public view virtual override
    returns (
        address owner,
        uint8 state,
        string memory identity,
        uint256 expiration,
        uint256 bitmask
    )
    {
        owner = ownerOf(tokenId);
        state = uint8(tokenStates[tokenId]);
        identity = tokenURIs[tokenId];
        expiration = expirations[tokenId];
        bitmask = _getBitMask(tokenId);

        return (owner, state, identity, expiration, bitmask);
    }

    /**
    * @dev Triggers to get gateway token state with specified `tokenId`
    * @param tokenId Gateway token id
    */
    function getTokenState(uint256 tokenId) public view virtual override returns (uint8 state) {
        state = uint8(tokenStates[tokenId]);

        return state;
    }

    /**
    * @dev Returns whether `tokenId` exists and not frozen.
    */
    function _existsAndActive(uint256 tokenId, bool allowExpired) internal view virtual returns (bool) {
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

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual override returns (bool) {
        require(!transfersRestricted(), "TRANSFERS RESTRICTED");
        require(_exists(tokenId), "ERC721: operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        uint256 network = slotOf(tokenId);
        if (spender == owner) {
            return true;
        } else {
            return (getApproved(tokenId) == spender || isApprovedForAll(owner, spender) || hasRole(GATEKEEPER_ROLE, network, spender));
        }
    }

    /**
    * @dev Triggers to burn gateway token
    * @param tokenId Gateway token id
    */
    function burn(uint256 tokenId) public virtual {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _burn(tokenId);
    }

    /**
    * @dev Triggers to mint gateway token
    * @param to Gateway token owner
    * @param network Gateway token type
    * @param mask The bitmask for the token
    */
    function mint(address to, uint256 network, uint256 expiration, uint256 mask, string memory tokenURI, Charge calldata) public virtual {
        require(hasRole(GATEKEEPER_ROLE, network, _msgSender()), "MUST BE GATEKEEPER");

        uint256 tokenId = ERC3525._mint(to, network, 1);

        if (expiration > 0) {
            expirations[tokenId] = expiration;
        }

        if (mask > 0) {
            _setBitMask(tokenId, mask);
        }

        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }
    }

    function revoke(uint256 tokenId) public virtual override {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");

        tokenStates[tokenId] = TokenState.REVOKED;

        emit Revoke(tokenId);
    }

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function freeze(uint256 tokenId) public virtual override {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");

        _freeze(tokenId);
    }

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    */
    function unfreeze(uint256 tokenId) public virtual override {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");

        _unfreeze(tokenId);
    }


    /**
    * @dev Triggers to get specified `tokenId` expiration timestamp
    * @param tokenId Gateway token id
    */
    function getExpiration(uint256 tokenId) public view virtual override returns (uint256) {
        require(_exists(tokenId), "TOKEN DOESN'T EXIST OR FROZEN");
        return expirations[tokenId];
    }

    /**
    * @dev Triggers to set expiration for tokenId
    * @param tokenId Gateway token id
    */
    function setExpiration(uint256 tokenId, uint256 timestamp, Charge calldata) public virtual override {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");

        _setExpiration(tokenId, timestamp);
    }

    /**
    * @dev Freezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Freeze} event.
    */
    function _freeze(uint256 tokenId) internal virtual {
        require(_existsAndActive(tokenId, true), "TOKEN DOESN'T EXISTS OR NOT ACTIVE");

        tokenStates[tokenId] = TokenState.FROZEN;

        emit Freeze(tokenId);
    }

    /**
    * @dev Unfreezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Unfreeze} event.
    */
    function _unfreeze(uint256 tokenId) internal virtual {
        require(_exists(tokenId), "TOKEN DOES NOT EXIST");
        require(tokenStates[tokenId] == TokenState.FROZEN, "TOKEN NOT FROZEN");

        tokenStates[tokenId] = TokenState.ACTIVE;

        emit Unfreeze(tokenId);
    }

    /**
    * @dev Sets expiration time for `tokenId`.
    */
    function _setExpiration(uint256 tokenId, uint256 timestamp) internal virtual {
        require(_existsAndActive(tokenId, true), "TOKEN DOES NOT EXIST OR IS INACTIVE");

        expirations[tokenId] = timestamp;
        emit Expiration(tokenId, timestamp);
    }

    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        tokenURIs[tokenId] = tokenURI;
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
        uint256 tokenId
    ) internal virtual {}

    // ===========  ACCESS CONTROL SECTION ============

    /**
    * @dev Triggers to add new gatekeeper into the system. 
    * @param gatekeeper Gatekeeper address
    */
    function addGatekeeper(address gatekeeper, uint256 network) public virtual {
        grantRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to remove existing gatekeeper from gateway token. 
    * @param gatekeeper Gatekeeper address
    */
    function removeGatekeeper(address gatekeeper, uint256 network) public virtual {
        revokeRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to verify if address has a GATEKEEPER role. 
    * @param gatekeeper Gatekeeper address
    */
    function isGatekeeper(address gatekeeper, uint256 network) external view virtual override returns (bool) {
        return hasRole(GATEKEEPER_ROLE, network, gatekeeper);
    }

    /**
    * @dev Triggers to add new network authority into the system. 
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function addNetworkAuthority(address authority, uint256 network) external virtual override {
        grantRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
    * @dev Triggers to remove existing network authority from gateway token. 
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function removeNetworkAuthority(address authority, uint256 network) external virtual override {
        revokeRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    /**
    * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role. 
    * @param authority Network Authority address
    */
    function isNetworkAuthority(address authority, uint256 network) external view virtual override returns (bool) {
        return hasRole(NETWORK_AUTHORITY_ROLE, network, authority);
    }

    // ===========  ACCESS CONTROL SECTION ============

    /**
    * @dev Transfers Gateway Token DAO Manager access from daoManager to `newManager`
    * @param newManager Address to transfer DAO Manager role for.
    * @notice GatewayToken contract has to be DAO Governed
    */
    function transferDAOManager(address previousManager, address newManager, uint256 network) public override {
        require(isNetworkDAOGoverned[network], "NOT DAO GOVERNED");
        require(hasRole(DAO_MANAGER_ROLE, network, previousManager), "INCORRECT OLD MANAGER");
        require(hasRole(DAO_MANAGER_ROLE, network, _msgSender()), "MUST BE DAO MANAGER");
        require(newManager != address(0), "ZERO ADDRESS");

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
    function getTokenBitmask(uint256 tokenId) public view returns (uint256) {
        uint256 mask = _getBitMask(tokenId);

        return mask;
    }

    /**
    * @dev Triggers to set full bitmask for gateway token with `tokenId`
    */
    function setBitmask(uint256 tokenId, uint256 mask) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _setBitMask(tokenId, mask);
    }

    /**
    * @dev Triggers to add bitmask for gateway token with `tokenId`
    */
    function addBitmask(uint256 tokenId, uint256 mask) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _addBitMask(tokenId, mask);
    }

    /**
    * @dev Triggers to add one bit at particular `index` for gateway token with `tokenId`
    */
    function addBit(uint256 tokenId, uint8 index) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _addBit(tokenId, index);
    }

    /**
    * @dev Triggers to remove bits in `removingMask` for gateway token with `tokenId`
    */
    function removeBitmask(uint256 tokenId, uint8 removingMask) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _removeBits(tokenId, removingMask);
    }

    /**
    * @dev Triggers to clear one bit at particular `index` for gateway token with `tokenId`
    */
    function removeBit(uint256 tokenId,  uint8 index) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _clearBit(tokenId, index);
    }

    /**
    * @dev Triggers to clear bitmask for gateway token with `tokenId`
    */
    function clearBitmask(uint256 tokenId) public {
        require(hasRole(GATEKEEPER_ROLE, slotOf(tokenId), _msgSender()), "MUST BE GATEKEEPER");
        _clearBitMask(tokenId);
    }
}