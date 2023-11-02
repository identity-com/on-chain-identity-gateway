// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

abstract contract  IGatewayNetwork {
    // Ranges from 0% - 100%
    /**
     * @dev Struct that describes the fees of each 
     */
    struct NetworkFeesPercentage {
        // Token address used to pay fees. Zero address for this mean native eth
        address tokenAddress;
        uint16 issueFee;
        uint16 refreshFee;
        uint16 expireFee;
    }

    /**
     * @dev This struct represents data associated with the state of a gatekeeper network
     */
    struct GatekeeperNetworkData {
        // the authority for this network
        address primaryAuthority;

        // Unique identifier for a network.
        bytes32 name;
        
        // The default expiration timestamp of passes on this network.
        // A value of 0 means passes never expire
        uint256 passExpireTimestamp;
        
        //Features on the network
        uint256 networkFeatureMask;
        
        NetworkFeesPercentage[] networkFees;

        // Token supported for fees on this network. The zero address represents native eth.
        // Once a network is created, there is no way to update the supported token.
        address supportedToken;

        address[] gatekeepers;
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

    function createNetwork(GatekeeperNetworkData calldata network) external virtual;
    function closeNetwork(bytes32 networkName) external virtual;
    function updatePassExpirationTimestamp(uint newExpirationTimestamp, bytes32 networkName) external virtual;
    function addGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function removeGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function updatePrimaryAuthority(address newPrimaryAuthortiy, bytes32 networkName) external virtual;
    function claimPrimaryAuthority(bytes32 networkName) external virtual;
    function updateNetworkFeatures(uint256 newFeatureMask, bytes32 networkName) external virtual;
    function networkHasFeature(bytes32 networkName, NetworkFeature feature) public view virtual returns (bool);
    function getNetwork(uint networkId) external view virtual returns(GatekeeperNetworkData memory);
    function getNetworkId(bytes32 networkName) external view virtual returns(uint);
    function getSupportedToken(bytes32 networkName) public view virtual returns(address);
    function isGateKeeper(bytes32 networkName, address gatekeeper) public view virtual returns(bool);
    function doesNetworkExist(uint networkId) public view virtual returns(bool);
}