// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IGatewayTokenVerifier.sol";

contract isGated {
    modifier gated(address gatewayToken, uint256 gatekeeperNetwork) {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(gatewayToken);
        require(verifier.verifyToken(msg.sender, gatekeeperNetwork));
        _;
    }
}
