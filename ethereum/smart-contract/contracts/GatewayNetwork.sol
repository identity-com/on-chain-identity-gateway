// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { ParameterizedAccessControl } from "./ParameterizedAccessControl.sol";
import { IGatewayNetwork } from "./interfaces/IGatewayNetwork.sol";

contract GatewayNetwork is ParameterizedAccessControl, IGatewayNetwork {
    mapping(bytes32 => GatekeeperNetworkData) public _networks;

    modifier onlyPrimaryNetworkAuthority(bytes32 networkName) {
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        require(msg.sender == _networks[networkName].primaryAuthority, "Only the primary authority can perform this action");
        _;
    }

    constructor() {
        // Contract deployer is the initial super admin
        _superAdmins[msg.sender] = true;
    }
   
    function createNetwork(GatekeeperNetworkData calldata network) external override onlySuperAdmin {
        bytes32 networkName = network.name;

        require(networkName != bytes32(0), "Network name cannot be an empty string");
        require(network.primaryAuthority != address(0), "Network primary authority cannot be zero address");
        // Check if network name already exist. If it does throw and error
        if(_networks[networkName].primaryAuthority != address(0)) {
            revert GatewayNetworkAlreadyExists(string(abi.encodePacked(networkName)));
        }
        
        _networks[networkName] = network;

        emit GatekeeperNetworkCreated(network.primaryAuthority, networkName, network.passExpireTimeInSeconds);
    } 
    function closeNetwork(bytes32 networkName) external override onlyPrimaryNetworkAuthority(networkName) {
        require(_networks[networkName].name.length != 0, "Network does not exist");
        require(_networks[networkName].gatekeepers.length == 0, "Network can only be removed if no gatekeepers are in it");

        delete _networks[networkName];

        emit GatekeeperNetworkDeleted(networkName);
    }

    function updateNetwork(GatewayNetworkUpdateOperation networkUpdate, GatekeeperNetworkData calldata network) external override onlyPrimaryNetworkAuthority(network.name){

        bytes32 networkName = network.name;
        
        if(networkUpdate == GatewayNetworkUpdateOperation.PRIMARY_AUTHORITY){
            require(network.primaryAuthority != address(0), "Primary authority cannot be set to the zero address");
            _networks[networkName].primaryAuthority = network.primaryAuthority;
            emit GatekeeperNetworkUpdated(networkUpdate);
            return;
        }
        // Miniumum and maximum values needed?
        if(networkUpdate == GatewayNetworkUpdateOperation.PASS_EXPIRE_TIME){
            _networks[networkName].passExpireTimeInSeconds = network.passExpireTimeInSeconds;
            emit GatekeeperNetworkUpdated(networkUpdate);
            return;
        }

        
        if(networkUpdate == GatewayNetworkUpdateOperation.SUPPORTED_TOKENS){
            address[] memory supportedTokens = network.supportedTokens;

            for(uint i; i < supportedTokens.length; i++) {
                require(supportedTokens[i] != address(0), "Zero address cannot be added to supported token");
            }
            _networks[networkName].supportedTokens = supportedTokens;
            emit GatekeeperNetworkUpdated(networkUpdate);
            return;
        }

        if(networkUpdate == GatewayNetworkUpdateOperation.GATEKEEPERS){
            address[] memory gatekeepers = network.gatekeepers;

            for(uint i; i < gatekeepers.length; i++) {
                require(gatekeepers[i] != address(0), "Zero address cannot be added as a gatekeeper");
            }

            _networks[networkName].gatekeepers = gatekeepers;
            emit GatekeeperNetworkUpdated(networkUpdate);
            return;
        }

        revert GatewayNetworkUnsupportedUpdate(uint(networkUpdate));
    }

    function isGateKeeper(bytes32 networkName, address gatekeeper) public view override returns(bool) {
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        address[] memory gatekeepers = _networks[networkName].gatekeepers;

        for(uint i = 0; i < gatekeepers.length; i++) {
            if(gatekeepers[i] == gatekeeper) {
                return true;
            }
        }
        return false;
    }

    function supportedTokens(bytes32 networkName) public view returns(address[] memory) {
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        return _networks[networkName].supportedTokens;
    }

    function gatekeepersOnNetwork(bytes32 networkName) public view returns(address[] memory) {
        require(_networks[networkName].primaryAuthority != address(0), "Network does not exist");
        return _networks[networkName].gatekeepers;
    }

}