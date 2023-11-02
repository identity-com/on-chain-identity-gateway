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
        
        // The default expiration timestamp of passes on this network
        uint256 passExpireTimestamp;
        
        //Features on the network, index relates to which feature it is.
        uint32 networkFeatures;
        
        NetworkFeesPercentage[] networkFees;

        // Tokens supported for fees on this network. The zero address represents native eth
        address[] supportedTokens;
        address[] gatekeepers;
    }

    enum GatewayNetworkUpdateOperation {
        PRIMARY_AUTHORITY,
        PASS_EXPIRE_TIME,
        NETWORK_FEATURES, // TODO to implement
        SUPPORTED_TOKENS
    }

    event GatekeeperNetworkCreated(address primaryAuthority, bytes32 name, uint passExpireTime);
    event GatekeeperNetworkUpdated(GatewayNetworkUpdateOperation updateType);
    event GatekeeperNetworkGatekeeperAdded(address gatekeeper);
    event GatekeeperNetworkGatekeeperRemoved(address gatekeeper);
    event GatekeeperNetworkDeleted(bytes32 networkName);

    /// The gatekeeper network being created already exists.
    /// @param network gatekeeper network id.
    error GatewayNetworkAlreadyExists(string network);

    /// The gatekeeper network update is not supported
    /// @param requestedUpdate requested update operation
    error GatewayNetworkUnsupportedUpdate(uint requestedUpdate);
    error GatewayNetworkGatekeeperAlreadyExists(string network, address gatekeeper);
    error GatewayNetworkGatekeeperDoesNotExists(string network, address gatekeeper);

    function createNetwork(GatekeeperNetworkData calldata network) external virtual;
    function closeNetwork(bytes32 networkName) external virtual;
    function updateNetwork(GatewayNetworkUpdateOperation networkUpdate, GatekeeperNetworkData calldata network) public virtual;
    function updatePassExpirationTimestamp(uint newExpirationTimestamp, bytes32 networkName) external virtual;
    function addGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function removeGatekeeper(address gatekeeper, bytes32 network) external virtual;
    function getNetwork(uint networkId) external view virtual returns(GatekeeperNetworkData memory);
    function getNetworkId(bytes32 networkName) external view virtual returns(uint);
    function isGateKeeper(bytes32 networkName, address gatekeeper) public view virtual returns(bool);
    function doesNetworkExist(uint networkId) public view virtual returns(bool);
}