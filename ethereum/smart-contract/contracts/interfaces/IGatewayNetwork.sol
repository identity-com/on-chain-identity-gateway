// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { IGatewayGatekeeper } from './IGatewayGatekeeper.sol';
abstract contract  IGatewayNetwork {

    /**
     * @dev Struct that describes the fees of each 
     * All network fees are represented in basis points (bps) ranges from 0%(0 bps) - 100% (10000 bps)
     */
    struct NetworkFeesBps {
        uint16 issueFee;
        uint16 refreshFee;
        uint16 expireFee;
        uint16 freezeFee;
    }

    uint16 MAX_FEE_BPS = 10000; // 100%
    uint256 public FEE_CONFIG_DELAY_TIME = 7 days;

    /**
     * @dev This struct represents data associated with the state of a gatekeeper network
     */
    struct GatekeeperNetworkData {
        // the authority for this network
        address primaryAuthority;

        // Unique identifier for a network.
        bytes32 name;
        
        // The default expiration time in seconds of passes on this network.
        // A value of 0 means passes never expire
        uint256 passExpireDurationInSeconds;
        
        //Features on the network
        uint256 networkFeatureMask;
        
        NetworkFeesBps networkFee;

        // Token supported for fees on this network. The zero address represents native eth.
        // Once a network is created, there is no way to update the supported token.
        address supportedToken;

        address[] gatekeepers;
        uint256 lastFeeUpdateTimestamp;
    }

    enum NetworkFeature {
        // if set, gateway tokens are considered invalid if the gatekeeper that minted them is removed from the network
        // defaults to false, and can be set by the network authority.
        REMOVE_GATEKEEPER_INVALIDATES_TOKENS
    }

    event GatekeeperNetworkCreated(address primaryAuthority, bytes32 name, uint passExpireTime);
    event GatekeeperNetworkGatekeeperAdded(address gatekeeper);
    event GatekeeperNetworkGatekeeperRemoved(address gatekeeper);
    event GatekeeperNetworkDeleted(bytes32 networkName);

    /// The gatekeeper network being created already exists.
    /// @param network gatekeeper network id.
    error GatewayNetworkAlreadyExists(string network);

    error GatewayNetworkGatekeeperAlreadyExists(string network, address gatekeeper);
    error GatewayNetworkGatekeeperDoesNotExists(string network, address gatekeeper);
    error GatewayNetwork_Cannot_Be_Sent_Eth_Directly();
    error GatewayNetwork__TransferFailed(uint256 value);
    error GatewayNetwork_Fee_Cannot_Be_Updated_Yet(uint lastUpdateTimestamp, uint nextAvalibleUpdateTimestamp);
    
    function createNetwork(GatekeeperNetworkData calldata network) external virtual;
    function transferNetworkFees(uint256 feeAmount, bytes32 networkName, address tokenSender) external payable virtual;
    function withdrawNetworkFees(bytes32 networkName) external payable virtual;
    function closeNetwork(bytes32 networkName) external virtual;
    function updatePassExpirationTime(uint newExpirationTimeInSeconds, bytes32 networkName) external virtual;
    function addGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function removeGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function updatePrimaryAuthority(address newPrimaryAuthortiy, bytes32 networkName) external virtual;
    function updateGatekeeperStatus(address gatekeeper, bytes32 networkName, IGatewayGatekeeper.GatekeeperStatus status) external virtual;
    function claimPrimaryAuthority(bytes32 networkName) external virtual;
    function updateNetworkFeatures(uint256 newFeatureMask, bytes32 networkName) external virtual;
    function updateFees(NetworkFeesBps calldata fees, bytes32 networkName) external virtual;
    function resetNetworkFeeUpdateTime(bytes32 networkName) external virtual;
    function networkHasFeature(bytes32 networkName, NetworkFeature feature) public view virtual returns (bool);
    function getNetwork(uint networkId) external view virtual returns(GatekeeperNetworkData memory);
    function getNetworkId(bytes32 networkName) external view virtual returns(uint);
    function getSupportedToken(bytes32 networkName) public view virtual returns(address);
    function isGateKeeper(bytes32 networkName, address gatekeeper) public view virtual returns(bool);
    function doesNetworkExist(uint networkId) public view virtual returns(bool);
}