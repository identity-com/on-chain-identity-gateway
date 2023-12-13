// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

abstract contract  IGatewayGatekeeper {
    enum GatekeeperStatus {
        HALTED,
        ACTIVE,
        FROZEN
    }

    // the amount in either wei (if fee is paid in ETH) or ERC20 minor denomination (if fee is paid in ERC20)
    struct GatekeeperFees{
        uint256 issueFee;
        uint256 refreshFee;
        uint256 expireFee;
        uint256 freezeFee;
    }

    struct GatekeeperNetworkData { 
        bool initialized;
        GatekeeperStatus status;
        GatekeeperFees fees;
        uint256 lastFeeUpdateTimestamp;
    }

    event GatekeeperStatusChanged(GatekeeperStatus oldStatus, GatekeeperStatus newStatus);

    error GatekeeperNotInNetwork(uint networkId, address gatekeeper);
    error GatekeeperFeeCannotBeUpdatedYet(uint lastUpdateTimestamp, uint nextAvalibleUpdateTimestamp);
    /**
     *@dev A mapping of the primaryAuthority of a gatekeeper, of a mapping of the gatekeepers configuration by networkId
     */

    uint256 public FEE_CONFIG_DELAY_TIME = 7 days;

    mapping(address => mapping(bytes32 => GatekeeperNetworkData)) internal _gatekeeperStates;

    function setNetworkContractAddress(address gatewayNetworkContract) external virtual;

    function getGatekeeperNetworkData(bytes32 networkName, address gatekeeper) external view virtual returns(GatekeeperNetworkData memory);
    function initializeGatekeeperNetworkData(bytes32 networkName, address gatekeeper, GatekeeperStatus initialStatus) external virtual;

    function updateGatekeeperStatus(bytes32 networkName, address gatekeeper, GatekeeperStatus status) external virtual;
    function updateFees(GatekeeperFees calldata fees, bytes32 networkName) external virtual;
    // What are the conditions for removing a gatekeeper?
    function removeGatekeeper(bytes32 networkName, address gatekeeper) external virtual;
}