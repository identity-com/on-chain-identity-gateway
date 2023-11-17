// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

abstract contract  IGatewayGatekeeper {
    enum GatekeeperStatus {
        HALTED,
        ACTIVE,
        FROZEN
    }

    struct GatekeeperFees{
        uint64 issueFee;
        uint64 refreshFee;
        uint64 expireFee;
        uint64 verificationFee;
    }

    struct GatekeeperNetworkData { 
        bool initialized;
        GatekeeperStatus status;
        GatekeeperFees fees;
    }

    event GatekeeperStatusChanged(GatekeeperStatus oldStatus, GatekeeperStatus newStatus);

    error GatekeeperNotInNetwork(uint networkId, address gatekeeper);
    /**
     *@dev A mapping of the primaryAuthority of a gatekeeper, of a mapping of the gatekeepers configuration by networkId
     */
    mapping(address => mapping(bytes32 => GatekeeperNetworkData)) internal _gatekeeperStates;

    function setNetworkContractAddress(address gatewayNetworkContract) external virtual;

    function getGatekeeperNetworkData(bytes32 networkName, address gatekeeper) external view virtual returns(GatekeeperNetworkData memory);
    function initializeGatekeeperNetworkData(bytes32 networkName, address gatekeeper, GatekeeperStatus initialStatus) external virtual;

    function updateGatekeeperStatus(bytes32 networkName, address gatekeeper, GatekeeperStatus status) external virtual;
    function updateFees(GatekeeperFees calldata fees, bytes32 networkName) external virtual;
    // What are the conditions for removing a gatekeeper?
    function removeGatekeeper(bytes32 networkName, address gatekeeper) external virtual;
}