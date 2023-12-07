// SPDX-License-Identifier: MIT
pragma solidity 0.8.19; // Fixed version for concrete contracts

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
import {IGatewayNetwork} from "./interfaces/IGatewayNetwork.sol";
import {IGatewayGatekeeper} from "./interfaces/IGatewayGatekeeper.sol";
import {IERC721Freezable} from "./interfaces/IERC721Freezable.sol";
import {IERC721Expirable} from "./interfaces/IERC721Expirable.sol";
import {IERC721Revokable} from "./interfaces/IERC721Revokable.sol";
import {MultiERC2771ContextUpgradeable} from "./MultiERC2771ContextUpgradeable.sol";
import {Charge, ChargeParties, FeeType, ChargeType} from "./library/Charge.sol";
import {ParameterizedAccessControl} from "./ParameterizedAccessControl.sol";
import {Common__MissingAccount, Common__NotContract, Common__Unauthorized} from "./library/CommonErrors.sol";
import {BitMask} from "./library/BitMask.sol";
import {InternalTokenApproval} from "./library/InternalTokenApproval.sol";
import {IChargeHandler} from "./interfaces/IChargeHandler.sol";

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
    TokenBitMask
{
    using Address for address;
    using Strings for uint;
    using BitMask for uint256;

    // Mapping from token id to state
    mapping(uint => TokenState) internal _tokenStates;

    // Optional Mapping from token ID to expiration date
    mapping(uint => uint) internal _expirations;


    // Specifies the gatekeeper that minted a given token
    mapping(uint => address) internal _issuingGatekeepers;

    // Gatekeeper network contract addresses
    address internal _gatewayNetworkContract;
    // Gatekeeper contract address
    address internal _gatekeeperContract;

    IChargeHandler internal _chargeHandler;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // constructor is "empty" as we are using the proxy pattern,
    // where setup code is in the initialize function
    // called by the proxy contract
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string calldata name,
        string calldata symbol,
        address superAdmin,
        address flagsStorage,
        address chargeHandler,
        address[] calldata trustedForwarders,
        address _gatewayNetworkAddress,
        address _gatekeeperContractAddress
    ) external initializer {
        // Check for zero addresses
        if (superAdmin == address(0)) {
            revert Common__MissingAccount();
        }

        if (flagsStorage == address(0)) {
            revert Common__MissingAccount();
        }

        if (chargeHandler == address(0)) {
            revert Common__MissingAccount();
        }

        if (_gatewayNetworkAddress == address(0)) {
            revert Common__MissingAccount();
        }

        if (_gatekeeperContractAddress == address(0)) {
            revert Common__MissingAccount();
        }

        // Check for zero addresses in the trusted forwarders array
        for (uint256 i = 0; i < trustedForwarders.length; i++) {
            if (trustedForwarders[i] == address(0)) {
                revert Common__MissingAccount();
            }
        }

        __ERC3525_init(name, symbol, 0);
        __MultiERC2771ContextUpgradeable_init(trustedForwarders);

        _setFlagsStorage(flagsStorage);
        _setChargeHandler(chargeHandler);
        _gatewayNetworkContract = _gatewayNetworkAddress;
        _gatekeeperContract = _gatekeeperContractAddress;
        _superAdmins[superAdmin] = true;

        emit GatewayTokenInitialized(name, symbol, superAdmin, flagsStorage, chargeHandler, trustedForwarders);
    }

    function setMetadataDescriptor(address _metadataDescriptor) external onlySuperAdmin {
        _setMetadataDescriptor(_metadataDescriptor);
    }

    function addForwarder(address forwarder) external onlySuperAdmin {
        _addForwarder(forwarder);
        emit ForwarderAdded(forwarder);
    }

    function removeForwarder(address forwarder) external onlySuperAdmin {
        _removeForwarder(forwarder);
        emit ForwarderRemoved(forwarder);
    }

    /**
     * @dev Triggers to update FlagsStorage contract address
     * @param flagsStorage FlagsStorage contract address
     */
    function updateFlagsStorage(address flagsStorage) external onlySuperAdmin {
        // check for zero address
        if (flagsStorage == address(0)) {
            revert Common__MissingAccount();
        }
        _setFlagsStorage(flagsStorage);
    }

    /**
     * @dev Update the ChargeHandler contract address
     * @param chargeHandler ChargeHandler contract address
     */
    function updateChargeHandler(address chargeHandler) external onlySuperAdmin {
        _setChargeHandler(chargeHandler);
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
        ChargeParties calldata partiesInCharge
    ) external payable virtual {
        // CHECKS
        _checkGatekeeper(network);
        address gatekeeper = _msgSender();

        // EFFECTS
        uint tokenId = ERC3525Upgradeable._mint(to, network, 1);
        uint networkExpiration = block.timestamp + IGatewayNetwork(_gatewayNetworkContract).getNetwork(network).passExpireDurationInSeconds;
   
        if(networkExpiration > block.timestamp) {
            _expirations[tokenId] = networkExpiration;
        } else if (expiration > 0) {
            _expirations[tokenId] = expiration;
        }

        if (mask > 0) {
            _setBitMask(tokenId, mask);
        }

        _issuingGatekeepers[tokenId] = _msgSender();

        // INTERACTIONS
        _handleCharge(FeeType.ISSUE, network, gatekeeper, partiesInCharge);
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
     */
    function setExpiration(uint tokenId, uint timestamp, ChargeParties calldata partiesInCharge) external payable virtual {
        // CHECKS
        uint network = slotOf(tokenId);
        _checkGatekeeper(slotOf(tokenId));

        address gatekeeper = _msgSender();
        // EFFECTS
        _setExpiration(tokenId, timestamp);
        // INTERACTIONS
        _handleCharge(FeeType.REFRESH, network, gatekeeper, partiesInCharge);
    }



    /**
     * @dev Triggers to set full bitmask for gateway token with `tokenId`
     */
    function setBitmask(uint tokenId, uint mask) external virtual {
        _checkGatekeeper(slotOf(tokenId));
        _setBitMask(tokenId, mask);
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

    /**
     * @dev Internal function to set ChargeHandler contract address
     * @param chargeHandler ChargeHandler contract address
     */
    function _setChargeHandler(address chargeHandler) internal {
        _chargeHandler = IChargeHandler(chargeHandler);

        emit ChargeHandlerUpdated(chargeHandler);
    }

    function _handleCharge(FeeType feeType, uint networkId, address gatekeeper, ChargeParties calldata partiesInCharge) internal {
        IGatewayGatekeeper.GatekeeperNetworkData memory gatekeeperData = IGatewayGatekeeper(_gatekeeperContract).getGatekeeperNetworkData(bytes32(networkId), gatekeeper);
        IGatewayNetwork.GatekeeperNetworkData memory networkData = IGatewayNetwork(_gatewayNetworkContract).getNetwork(networkId);

        (uint256 totalFeeAmount, uint16 networkFeeBps) = _resolveTotalFeeAmount(feeType, gatekeeperData, networkData);
        
        ChargeType chargeType = (networkData.supportedToken == address(0)) ? ChargeType.ETH : ChargeType.ERC20;
        bool shouldBeNullCharge = totalFeeAmount == 0 && msg.value == 0;

        Charge memory charge = Charge(
            totalFeeAmount, 
            networkFeeBps, 
            shouldBeNullCharge ? ChargeType.NONE : chargeType, 
            networkData.supportedToken, 
            partiesInCharge
        );
        // solhint-disable-next-line no-empty-blocks
        try _chargeHandler.handleCharge{value: msg.value}(charge, networkId) {
            // done
        } catch (bytes memory reason) {
            // Rethrow the custom error from the charge handler
            // Using inline assembly here avoids the need to parse the revert reason
            // solhint-disable-next-line no-inline-assembly
            assembly {
                revert(add(32, reason), mload(reason))
            }
        }
    }

    function _resolveTotalFeeAmount(FeeType feeType, IGatewayGatekeeper.GatekeeperNetworkData memory gatekeeperData, IGatewayNetwork.GatekeeperNetworkData memory networkData) internal returns(uint256, uint16) {
        uint256 totalFeeAmount;
        uint16 networkFeeBps;

        if(feeType == FeeType.ISSUE) {
            totalFeeAmount = gatekeeperData.fees.issueFee;
            networkFeeBps = networkData.networkFee.issueFee;
        } else if(feeType == FeeType.EXPIRE) {
            totalFeeAmount = gatekeeperData.fees.expireFee;
            networkFeeBps = networkData.networkFee.expireFee;
        } else if(feeType == FeeType.REFRESH) {
            totalFeeAmount = gatekeeperData.fees.refreshFee;
            networkFeeBps = networkData.networkFee.refreshFee;
        } else if(feeType == FeeType.VERIFY) {
            totalFeeAmount = gatekeeperData.fees.verificationFee;
            networkFeeBps = networkData.networkFee.verificationFee;
        } else {
            revert GatewayToken__UnsupportedFeeType();
        }

        return(totalFeeAmount, networkFeeBps);
    }

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
        if (IGatewayNetwork(_gatewayNetworkContract).networkHasFeature(bytes32(network), IGatewayNetwork.NetworkFeature.REMOVE_GATEKEEPER_INVALIDATES_TOKENS)) {
            address gatekeeper = _issuingGatekeepers[tokenId];
            if (gatekeeper != address(0) && !IGatewayNetwork(_gatewayNetworkContract).isGateKeeper(bytes32(network), gatekeeper)) {
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
        // Checks if message sender is a gatekeeper on the given network
        bool isGatekeeper = IGatewayNetwork(_gatewayNetworkContract).isGateKeeper(bytes32(network), _msgSender());
        
        if(!isGatekeeper) {
            revert GatewayToken__AddressNotAGatekeeper(network, _msgSender());
        }
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
