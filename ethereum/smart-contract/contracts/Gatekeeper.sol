// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { IGatewayGatekeeper } from './interfaces/IGatewayGatekeeper.sol';
import { IGatewayNetwork } from "./interfaces/IGatewayNetwork.sol";
import { ParameterizedAccessControl } from "./ParameterizedAccessControl.sol";


contract Gatekeeper is ParameterizedAccessControl, IGatewayGatekeeper {
    address private _gatewayNetworkContract;


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


    function getGatekeeperNetworkData(uint networkId, address gatekeeper) external view override returns(GatekeeperNetworkData memory) {
        if(!_gatekeeperStates[gatekeeper][networkId].initialized) {
            revert GatekeeperNotInNetwork(networkId, gatekeeper);
        }
        return _gatekeeperStates[gatekeeper][networkId];
    }

    function initializeGatekeeperNetworkData(uint networkId, address gatekeeper, GatekeeperStatus initialStatus) external onlyNetworkContract override {
        _gatekeeperStates[gatekeeper][networkId].initialized = true;
        updateGatekeeperStatus(networkId, gatekeeper, initialStatus);
    }


    function updateGatekeeperStatus(uint networkId, address gatekeeper, GatekeeperStatus status) public onlyNetworkContract override {
        GatekeeperStatus oldStatus = _gatekeeperStates[gatekeeper][networkId].status;
        _gatekeeperStates[gatekeeper][networkId].status = status;
        emit GatekeeperStatusChanged(oldStatus, status);
    }

    function updateFees(GatekeeperFees calldata fees, uint networkId) external override {
        address gatekeeper = msg.sender;

        if(!_gatekeeperStates[gatekeeper][networkId].initialized) {
            revert GatekeeperNotInNetwork(networkId, gatekeeper);
        }

        _gatekeeperStates[gatekeeper][networkId].fees = fees;
    }

    function removeGatekeeper(uint networkId, address gatekeeper) external onlyNetworkContract override {
        delete _gatekeeperStates[gatekeeper][networkId];
    }

}