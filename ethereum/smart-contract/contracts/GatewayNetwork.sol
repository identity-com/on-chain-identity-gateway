// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ParameterizedAccessControl} from "./ParameterizedAccessControl.sol";

contract GatewayNetwork is ParameterizedAccessControl {

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
        
        // The default expiration time of passes on this network in seconds
        uint passExpireTimeInSeconds;
        
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
        SUPPORTED_TOKENS,
        GATEKEEPERS
    }

    event GatekeeperNetworkCreated(address primaryAuthority, bytes32 name, uint passExpireTime);

    /// The gatekeeper network being created already exists.
    /// @param network gatekeeper network id.
    error GatewayNetworkAlreadyExists(string network);

    /// The gatekeeper network update is not supported
    /// @param requestedUpdate requested update operation
    error GatewayNetworkUnsupportedUpdate(uint requestedUpdate);

    bytes32 public constant GATEKEEPER_ROLE = keccak256("GATEKEEPER_ROLE");

    mapping(bytes32 => GatekeeperNetworkData) public _networks;

    modifier onlyPrimaryNetworkAuthority(bytes32 networkName) {
        require(msg.sender == _networks[networkName].primaryAuthority, "Only the primary authority");
        _;
    }

    constructor() {
        // Contract deployer is the initial super admin
        _superAdmins[msg.sender] = true;
    }
   
    function createNetwork(GatekeeperNetworkData calldata network) external onlySuperAdmin {
        bytes32 networkName = network.name;

        require(networkName != bytes32(0), "Network name cannot be an empty string");
        require(network.primaryAuthority != address(0), "Network primary authority cannot be zero address");
        // Check if network name already exist. If it does throw and error
        if(_networks[networkName].primaryAuthority != address(0)) {
            revert GatewayNetworkAlreadyExists(string(abi.encodePacked(networkName)));
        }
        
        _networks[networkName] = network;

        // Domain is determined by the network name
        uint256 domain = uint256(networkName);
        address[] memory gatekeepers = network.gatekeepers;

        for (uint i = 0; i < gatekeepers.length; i++) {
            _grantRole(GATEKEEPER_ROLE, domain, gatekeepers[i]);
        }
    } 
    function closeNetwork(bytes32 networkName) external onlySuperAdmin {
        require(_networks[networkName].name.length != 0, "Network does not exist");
        require(_networks[networkName].gatekeepers.length == 0, "Network can only be removed if no gatekeepers are in it.");

        delete _networks[networkName];
    }

    function updateNetwork(GatewayNetworkUpdateOperation networkUpdate, GatekeeperNetworkData calldata network) external onlyPrimaryNetworkAuthority(network.name){

        bytes32 networkName = network.name;
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        
        if(networkUpdate == GatewayNetworkUpdateOperation.PRIMARY_AUTHORITY){
            require(network.primaryAuthority != address(0), "Primary authority cannot be set to the zero address");
            _networks[networkName].primaryAuthority = network.primaryAuthority;
        }
        // Miniumum and maximum values needed?
        if(networkUpdate == GatewayNetworkUpdateOperation.PASS_EXPIRE_TIME){
            _networks[networkName].passExpireTimeInSeconds = network.passExpireTimeInSeconds;
        }

        
        if(networkUpdate == GatewayNetworkUpdateOperation.SUPPORTED_TOKENS){
            address[] memory supportedTokens = network.supportedTokens;

            for(uint i; i < supportedTokens.length; i++) {
                require(supportedTokens[i] != address(0), "Zero address cannot be added to supported token");
            }
            _networks[networkName].supportedTokens = supportedTokens;
        }

        if(networkUpdate == GatewayNetworkUpdateOperation.GATEKEEPERS){
            address[] memory gatekeepers = network.gatekeepers;

            for(uint i; i < gatekeepers.length; i++) {
                require(gatekeepers[i] != address(0), "Zero address cannot be added as a gatekeeper");
            }

            _networks[networkName].gatekeepers = gatekeepers;
        }

        revert GatewayNetworkUnsupportedUpdate(uint(networkUpdate));
    }

    function isGateKeeper(bytes32 networkName, address gatekeeper) public view returns(bool) {
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        address[] memory gatekeepers = _networks[networkName].gatekeepers;

        for(uint i = 0; i < gatekeepers.length; i++) {
            if(gatekeepers[i] == gatekeeper) {
                return true;
            }
        }
        return false;
    }

}