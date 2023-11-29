// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { IGatewayGatekeeper } from './interfaces/IGatewayGatekeeper.sol';
import { IGatewayNetwork } from "./interfaces/IGatewayNetwork.sol";
import { ParameterizedAccessControl } from "./ParameterizedAccessControl.sol";


contract Gatekeeper is ParameterizedAccessControl, IGatewayGatekeeper {
    address public _gatewayNetworkContract;


    modifier onlyNetworkContract() {
        require(msg.sender == _gatewayNetworkContract, "Only the gateway network contract can interact with this function");
        _;
    }

    constructor() {
        // Contract deployer is the initial super admin
        _superAdmins[msg.sender] = true;
    }

    function setNetworkContractAddress(address gatewayNetworkContract) external onlySuperAdmin override {
        _gatewayNetworkContract = gatewayNetworkContract;
    }


    function getGatekeeperNetworkData(bytes32 networkName, address gatekeeper) external view override returns(GatekeeperNetworkData memory) {
        if(!_gatekeeperStates[gatekeeper][networkName].initialized) {
            revert GatekeeperNotInNetwork(uint256(networkName), gatekeeper);
        }
        return _gatekeeperStates[gatekeeper][networkName];
    }

    function initializeGatekeeperNetworkData(bytes32 networkName, address gatekeeper, GatekeeperStatus initialStatus) external onlyNetworkContract override {
        _gatekeeperStates[gatekeeper][networkName].initialized = true;
        updateGatekeeperStatus(networkName, gatekeeper, initialStatus);
    }


    function updateGatekeeperStatus(bytes32 networkName, address gatekeeper, GatekeeperStatus status) public onlyNetworkContract override {
        GatekeeperStatus oldStatus = _gatekeeperStates[gatekeeper][networkName].status;
        _gatekeeperStates[gatekeeper][networkName].status = status;
        emit GatekeeperStatusChanged(oldStatus, status);
    }

    function updateFees(GatekeeperFees calldata fees, bytes32 networkName) external override {
        address gatekeeper = msg.sender;

        if(!_gatekeeperStates[gatekeeper][networkName].initialized) {
            revert GatekeeperNotInNetwork(uint256(networkName), gatekeeper);
        }

        _gatekeeperStates[gatekeeper][networkName].fees = fees;
    }

    function removeGatekeeper(bytes32 networkName, address gatekeeper) external onlyNetworkContract override {
        delete _gatekeeperStates[gatekeeper][networkName];
    }

}