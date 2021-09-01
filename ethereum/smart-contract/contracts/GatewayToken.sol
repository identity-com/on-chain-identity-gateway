// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "./interfaces/IERC721Freezeble.sol";
import "./interfaces/IGatewayToken.sol";
import "./interfaces/IGatewayTokenController.sol";
import "./interfaces/IERC721Expirable.sol";

/**
 * @dev Gateway Token contract is responsible for managing Identity.com KYC gateway tokens 
 * those tokens represent completed KYC with attached identity. 
 * Gateway tokens using ERC721 standard with custom extentions.
 *
 * Contract handles multiple levels of access such as Network Authority (may represent a specific regulator body) 
 * Gatekeepers (Identity.com network parties who can mint/burn/freeze gateway tokens) and overall system Admin who can add
 * new Gatekeepers and Network Authorities
 */
contract GatewayToken is ERC165, AccessControl, IERC721, IERC721Metadata, IERC721Freezeble, IERC721Expirable, IGatewayToken {
    using Address for address;
    using Strings for uint256;

    // Gateway Token name
    string public override name;

    // Gateway Token symbol
    string public override symbol;

    // Gateway Token controller contract address
    address public controller;
    address public deployer;

    // Gateway token transfer restrictions
    bool public isTransfersRestricted;

    // Off-chain DAO governance access control
    bool public override isDAOGoverned;
    address public override daoManager;

    // Access control roles
    bytes32 public constant DAO_MANAGER_ROLE = keccak256("DAO_MANAGER_ROLE");
    bytes32 public constant GATEKEEPER_ROLE = keccak256("GATEKEEPER_ROLE");
    bytes32 public constant NETWORK_AUTHORITY_ROLE = keccak256("NETWORK_AUTHORITY_ROLE");

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) private _operatorApprovals;

    // Mapping from token ID to freeze param
    mapping(uint256 => bool) private _isFreezed;

    // Optional mapping for gateway token Identities (via TokenURI)
    mapping(uint256 => string) private _tokenURIs;

    // Optional Mapping from token ID to expiration date
    mapping(uint256 => uint256) private _expirations;

    // Optional Mapping from address to tokenID
    mapping(address => uint256) private _defaultTokens;

    // @dev Modifier to prevent calls from anyone except Identity.com Admin
    modifier onlyIdentityAdmin() {
        require(msg.sender == IGatewayTokenController(controller).identityAdmin() || msg.sender == controller, "NOT IDENTITY.COM ADMIN NOR TOKEN CONTROLLER");
        _;
    }

    // @dev Modifier to prevent calls for blacklisted users
    modifier onlyNonBlacklistedUser(address user) {
        require(!_isBlacklisted(user), "BLACKLISTED USER");
        _;
    }

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
     * Initiates gateway token roles with main system admin `GATEWAY_TOKEN_CONTROLLER`,
     * `NETWORK_AUTHORITY_ROLE` responsible for adding/removing Gatekeepers and 
     * `GATEKEEPER_ROLE` responsible for minting/burning/transfering tokens
     */
    constructor(string memory _name, string memory _symbol, address _deployer, bool _isDAOGoverned, address _daoManager) public {
        name = _name;
        symbol = _symbol;
        controller = _msgSender();
        isTransfersRestricted = true;
        deployer = _deployer;

        _setupRole(NETWORK_AUTHORITY_ROLE, _msgSender());
        _setupRole(NETWORK_AUTHORITY_ROLE, deployer);
        _setupRole(GATEKEEPER_ROLE, deployer);

        if (_isDAOGoverned) {
            isDAOGoverned = _isDAOGoverned;

            require(_daoManager != address(0), "INCORRECT ADDRESS");
            // require(_daoManager.isContract(), "NON CONTRACT EXECUTOR"); uncomment while testing with Gnosis Multisig
            daoManager = _daoManager;

            _setupRole(DAO_MANAGER_ROLE, _daoManager);
            _setupRole(DAO_MANAGER_ROLE, _msgSender());
            _setupRole(NETWORK_AUTHORITY_ROLE, _daoManager);
            _setupRole(GATEKEEPER_ROLE, _daoManager);
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, DAO_MANAGER_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, DAO_MANAGER_ROLE);
        } else {
            _setRoleAdmin(NETWORK_AUTHORITY_ROLE, NETWORK_AUTHORITY_ROLE);
            _setRoleAdmin(GATEKEEPER_ROLE, NETWORK_AUTHORITY_ROLE);
        }
    }

    /**
     * @dev Returns true if gateway token owner transfers reestricted, and false otherwise.
     */
    function transfersRestricted() public view virtual returns (bool) {
        return isTransfersRestricted;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165, AccessControl) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
    * @dev Triggers to check total amount of gateway tokens hold by specific address. 
    * @param owner Token owner address
    */
    function balanceOf(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ZERO ADDRESS");
        return _balances[owner];
    }

    /**
    * @dev Triggers to get owner for specific gateway token
    * @param tokenId Gateway token id
    */
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "ZERO ADDRESS");
        return owner;
    }

    /**
    * @dev Triggers to get identity attached to specific gateway token
    * @param tokenId Gateway token id
    */
    function getIdentity(uint256 tokenId) public view virtual returns (string memory) {
        return tokenURI(tokenId);
    }

    /**
    * @dev Triggers to get tokenURI attached to specificied `tokenId`
    * @param tokenId Gateway token id
    */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "TOKEN DOESN'T EXIST OR FREEZED");
        string memory _tokenURI = _tokenURIs[tokenId];

        return _tokenURI;
    }

    /**
    * @dev Triggers to attach identity string to specific gateway token
    * @param tokenId Gateway token id
    * @param tokenURI Gateway token identity in a form of TokenURI
    *
    * @notice Only executable by gatekeepers
    */
    function setTokenURI(uint256 tokenId, string memory tokenURI) public virtual {
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");
        require(_existsAndActive(tokenId), "TOKEN DOESN'T EXIST OR FREEZED");
        address tokenOwner = ownerOf(tokenId);
        require(!_isBlacklisted(tokenOwner), "BLACKLISTED USER");

        _tokenURIs[tokenId] = tokenURI;
    }

    /**
    * @dev Triggered by external contract to verify if `tokenId` and token `owner` are correct.
    *
    * Checks if token exists in gateway token contract, `tokenId` still active, and not expired.
    * Performs additional checks to verify that `owner` is not blacklisted globally.
    */
    function verifyToken(address owner, uint256 tokenId) external view virtual returns (bool) {
        if(!_existsAndActive(tokenId)) return false;
        address tokenOwner = ownerOf(tokenId);
        if (tokenOwner != owner) return false;
        bool _blacklisted = _isBlacklisted(owner);
        if(_blacklisted) return false;

        return true;
    }

    /**
    * @dev Triggered by external contract to verify the validity of the default token for `owner`.
    *
    * Checks owner has any token on gateway token contract, `tokenId` still active, and not expired.
    * Performs additional checks to verify that `owner` is not blacklisted globally.
    */
    function verifyToken(address owner) external view virtual returns (bool) {
        uint256 tokenId = getTokenId(owner);
        if(!_existsAndActive(tokenId)) return false;
        address tokenOwner = ownerOf(tokenId);
        if (tokenOwner != owner) return false;
        bool _blacklisted = _isBlacklisted(owner);
        if(_blacklisted) return false;

        return true;
    }

    /**
    * @dev Triggers to get all information gateway token related to specified `tokenId`
    * @param tokenId Gateway token id
    */
    function getToken(uint256 tokenId) public view virtual override
        returns (
            address owner,
            bool isFreezed,
            string memory identity,
            uint256 expiration
        ) 
    {
        owner = ownerOf(tokenId);
        isFreezed = _isFreezed[tokenId];
        identity = _tokenURIs[tokenId];
        expiration = _expirations[tokenId];

        return (owner, isFreezed, identity, expiration);
    }

    /**
    * @dev Returns whether `tokenId` exists.
    *
    * Tokens start existing when they are minted (`_mint`),
    * pause when they are freezed (`_freeze`), and 
    * stop existing when they are burned (`_burn`).
    */
    function _exists(uint256 tokenId) internal view virtual returns (bool) {
        return _owners[tokenId] != address(0);
    }

    /**
    * @dev Returns whether `tokenId` exists and not freezed.
    */
    function _existsAndActive(uint256 tokenId) internal view virtual returns (bool) {
        if (_expirations[tokenId] != 0) {
            return _owners[tokenId] != address(0) && !_isFreezed[tokenId] && block.timestamp <= _expirations[tokenId];
        } else {
            return _owners[tokenId] != address(0) && !_isFreezed[tokenId];
        }
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual returns (bool) {
        require(_exists(tokenId), "ERC721: operator query for nonexistent token");
        address owner = ownerOf(tokenId);
        if (spender == owner) {
            return !transfersRestricted();
        } else {
            return (getApproved(tokenId) == spender || isApprovedForAll(owner, spender) || hasRole(GATEKEEPER_ROLE, spender));
        }
    }

    /**
    * @dev Triggers to request token ownership transfer
    * @param to Address to transfer token ownership
    * @param tokenId Gateway token id
    *
    * @notice Only executable by token owner
    */
    function approve(address to, uint256 tokenId) public virtual override {
        address owner = GatewayToken.ownerOf(tokenId);
        require(to != owner, "INCORRECT APPROVE DESTINATION");
        require(_msgSender() == owner, "INCORRECT OWNER");
        require(!_isBlacklisted(owner), "BLACKLISTED USER");

        _approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        require(_existsAndActive(tokenId), "TOKEN DOESN'T EXIST");

        return _tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved) public virtual override {
        require(operator != _msgSender(), "INCORRECT APPROVE");

        _operatorApprovals[_msgSender()][operator] = approved;
        emit ApprovalForAll(_msgSender(), operator, approved);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "MSG.SENDER NOT OWNER NOR GATEKEEPER");

        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "MSG.SENDER NOT OWNER NOR GATEKEEPER");
        _safeTransfer(from, to, tokenId, _data);
    }

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * `_data` is additional data, it has no specified format and it is sent in call to `to`.
     *
     * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
     * implement alternative mechanisms to perform token transfer, such as signature-based.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function _safeTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) internal virtual {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, _data), "TRANSFER TO NON ERC721Receiver IMPLEMENTER");
    }

    /**
    * @dev Triggers to burn gateway token
    * @param tokenId Gateway token id
    */
    function burn(uint256 tokenId) public virtual {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");

        _burn(tokenId);
    }

    /**
    * @dev Triggers to mint gateway token
    * @param to Gateway token owner
    * @param tokenId Gateway token id
    */
    function mint(address to, uint256 tokenId) public virtual onlyNonBlacklistedUser(to) {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");

        _mint(to, tokenId);
    }

    /**
    * @dev Triggers to mint gateway token with specified expiration `timestamp`
    * @param to Gateway token owner
    * @param tokenId Gateway token id
    * @param timestamp Expiration timestamp
    */
    function mintWithExpiration(address to, uint256 tokenId, uint256 timestamp) public virtual override onlyNonBlacklistedUser(to) {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");

        _mint(to, tokenId);
        _expirations[tokenId] = timestamp;
    }

    /**
    * @dev Triggers to freeze gateway token
    * @param tokenId Gateway token id
    */
    function freeze(uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");
        address tokenOwner = ownerOf(tokenId);
        require(!_isBlacklisted(tokenOwner), "BLACKLISTED USER");

        _freeze(tokenId);
    }

    /**
    * @dev Triggers to unfreeze gateway token
    * @param tokenId Gateway token id
    */
    function unfreeze(uint256 tokenId) public virtual override {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");
        address tokenOwner = ownerOf(tokenId);
        require(!_isBlacklisted(tokenOwner), "BLACKLISTED USER");

        _unfreeze(tokenId);
    }


    /**
    * @dev Triggers to get specificied `tokenId` expiration timestamp
    * @param tokenId Gateway token id
    */
    function expiration(uint256 tokenId) public view virtual override returns (uint256) {
        require(_exists(tokenId), "TOKEN DOESN'T EXIST OR FREEZED");
        uint256 _expiration = _expirations[tokenId];

        return _expiration;
    }

    /**
    * @dev Triggers to set expiration for tokenId
    * @param tokenId Gateway token id
    */
    function setExpiration(uint256 tokenId, uint256 timestamp) public virtual override {
        //solhint-disable-next-line max-line-length
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");
        address tokenOwner = ownerOf(tokenId);
        require(!_isBlacklisted(tokenOwner), "BLACKLISTED USER");

        _setExpiration(tokenId, timestamp);
    }

    /**
    * @dev Triggers to get default gateway token ID for `owner`
    * @param owner Token owner address
    */
    function getTokenId(address owner) public view virtual override returns (uint256) {
        require(owner != address(0), "ZERO ADDRESS");
        return _defaultTokens[owner];
    }

    /**
    * @dev Triggers to set token with specified `tokenId` as default for `owner`
    * @param owner  Token owner address
    * @param tokenId Gateway token id
    */
    function setDefaultTokenId(address owner, uint256 tokenId) public virtual override {
        require(_exists(tokenId), "TOKEN DOESN'T EXIST OR FREEZED");
        require(hasRole(GATEKEEPER_ROLE, _msgSender()), "MUST BE GATEKEEPER");

        address actualOwner = ownerOf(tokenId);
        require(actualOwner == owner, "INCORRECT OWNER");

        _defaultTokens[owner] = tokenId;
    }

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     *
     * Requirements:
     *
     * - `tokenId` must not exist.
     * - `to` cannot be the zero address.
     *
     * Emits a {Transfer} event.
     */
    function _mint(address to, uint256 tokenId) internal virtual {
        require(to != address(0), "ZERO ADDRESS");
        require(!_exists(tokenId), "TOKEN ALREADY EXISTS");

        _balances[to] += 1;
        _owners[tokenId] = to;
        if (_defaultTokens[to] == 0) {
            _defaultTokens[to] = tokenId;
        }

        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = GatewayToken.ownerOf(tokenId);

        // Clear all state associated with `tokenId`
        _approve(address(0), tokenId);
        delete _isFreezed[tokenId];
        delete _expirations[tokenId];
        if (bytes(_tokenURIs[tokenId]).length != 0) {
            delete _tokenURIs[tokenId];
        }

        if (_defaultTokens[owner] == tokenId) {
            delete _defaultTokens[owner];
        }

        _balances[owner] -= 1;
        delete _owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    /**
    * @dev Freezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Freeze} event.
    */
    function _freeze(uint256 tokenId) internal virtual {
        require(_existsAndActive(tokenId), "TOKEN DOESN'T EXISTS OR NOT ACTIVE");

        _isFreezed[tokenId] = true;

        emit Freeze(tokenId);
    }

    /**
    * @dev Unfreezes `tokenId` and it's usage by gateway token owner.
    *
    * Emits a {Unfreeze} event.
    */
    function _unfreeze(uint256 tokenId) internal virtual {
        require(_exists(tokenId), "TOKEN DOESN'T EXISTS");
        require(_isFreezed[tokenId], "TOKEN NOT FREEZED");

        _isFreezed[tokenId] = false;

        emit Unfreeze(tokenId);
    }

    /**
    * @dev Sets expiration time for `tokenId`.
    */
    function _setExpiration(uint256 tokenId, uint256 timestamp) internal virtual {
        require(_existsAndActive(tokenId), "TOKEN DOESN'T EXISTS OR ACTIVE");

        _expirations[tokenId] = timestamp;
        emit Expiration(tokenId, timestamp);
    }

    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        require(ownerOf(tokenId) == from, "INCORRECT TOKEN OWNER");
        require(to != address(0), "TRANSFER TO ZERO ADDRESS");

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

        if (_defaultTokens[from] == tokenId) {
            delete _defaultTokens[from];
            _defaultTokens[to] = tokenId;
        }

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        _tokenApprovals[tokenId] = to;
        emit Approval(GatewayToken.ownerOf(tokenId), to, tokenId);
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call is not executed if the target address is not a contract.
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param _data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) private returns (bool) {
        if (to.isContract()) {
            try IERC721Receiver(to).onERC721Received(_msgSender(), from, tokenId, _data) returns (bytes4 retval) {
                return retval == IERC721Receiver(to).onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    function _isBlacklisted(address user) private view returns (bool) {
        return IGatewayTokenController(controller).isBlacklisted(user);
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

    // ===========  ACCESS CONTROLL SECTION ============

    /**
    * @dev Triggers to add new gatekeeper into the system. 
    * @param gatekeeper Gatekeeper address
    */
    function addGatekeeper(address gatekeeper) public virtual {
        grantRole(GATEKEEPER_ROLE, gatekeeper);
    }

    /**
    * @dev Triggers to remove existing gatekeeper from gateway token. 
    * @param gatekeeper Gatekeeper address
    */
    function removeGatekeeper(address gatekeeper) public virtual {
        revokeRole(GATEKEEPER_ROLE, gatekeeper);
    }

    /**
    * @dev Triggers to add new network authority into the system. 
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function addNetworkAuthority(address authority) external virtual override {
        grantRole(NETWORK_AUTHORITY_ROLE, authority);
    }

    /**
    * @dev Triggers to remove existing network authority from gateway token. 
    * @param authority Network Authority address
    *
    * @notice Can be triggered by Gateway Token Controller or any Network Authority
    */
    function removeNetworkAuthority(address authority) external virtual override {
        revokeRole(NETWORK_AUTHORITY_ROLE, authority);
    }

    /**
    * @dev Triggers to verify if authority has a NETWORK_AUTHORITY_ROLE role. 
    * @param authority Network Authority address
    */
    function isNetworkAuthority(address authority) external virtual override returns (bool) {
        return hasRole(NETWORK_AUTHORITY_ROLE, authority);
    }

    // ===========  ACCESS CONTROLL SECTION ============

    /**
    * @dev Triggers to allow token transfers by token owners. 
    *
    * @notice Only triggered by Identity.com Admin
    */
    function allowTransfers() external virtual override whenTransfersRestricted onlyIdentityAdmin returns (bool) {
        isTransfersRestricted = false;
        emit TransfersAccepted(_msgSender());

        return true;
    }

    /**
    * @dev Triggers to stop token transfers by token owners. 
    *
    * @notice Only triggered by Identity.com Admin
    */
    function stopTransfers() external virtual override whenTransfersNotRestricted onlyIdentityAdmin returns (bool) {
        isTransfersRestricted = true;
        emit TransfersRestricted(_msgSender());

        return true;
    }

    /**
    * @dev Transfers Gateway Token DAO Manager access from daoManager to `newManager`
    * @param newManager Address to transfer DAO Manager role for.
    */
    function transferDAOManager(address newManager) public override {
        require(msg.sender == daoManager, "NOT DAO MANAGER");
        require(newManager != address(0), "ZERO ADDRESS");

        grantRole(DAO_MANAGER_ROLE, newManager);
        grantRole(NETWORK_AUTHORITY_ROLE, newManager);
        grantRole(GATEKEEPER_ROLE, newManager);

        revokeRole(GATEKEEPER_ROLE, daoManager);
        revokeRole(NETWORK_AUTHORITY_ROLE, daoManager);
        revokeRole(DAO_MANAGER_ROLE, daoManager);

        daoManager = newManager;

        emit DAOManagerTransfered(msg.sender, newManager);
    }
}