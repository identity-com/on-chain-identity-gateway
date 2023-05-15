// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";

contract Gated {
    address private _gatewayTokenContract;
    uint256 private _gatekeeperNetwork;

    /// The gateway token is not valid.
    error IsGated__InvalidGatewayToken(address gatewayToken);

    constructor(address gatewayTokenContract, uint256 gatekeeperNetwork) {
        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
    }

    modifier gated() {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(_gatewayTokenContract);
        if (!verifier.verifyToken(msg.sender, _gatekeeperNetwork)) {
            revert IsGated__InvalidGatewayToken(_gatewayTokenContract);
        }
        _;
    }
}
