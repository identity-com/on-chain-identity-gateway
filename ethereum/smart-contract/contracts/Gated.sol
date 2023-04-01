// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";

contract Gated {
    /// The gateway token is not valid.
    error IsGated__InvalidGatewayToken(address gatewayToken);

    modifier gated(address gatewayToken, uint256 gatekeeperNetwork) {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(gatewayToken);
        if (!verifier.verifyToken(msg.sender, gatekeeperNetwork)) {
            revert IsGated__InvalidGatewayToken(gatewayToken);
        }
        _;
    }
}
