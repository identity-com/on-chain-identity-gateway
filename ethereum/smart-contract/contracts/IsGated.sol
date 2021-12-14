// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IGatewayTokenVerifier.sol";

contract isGated {
    modifier gated(address gatekeeperNetwork) {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(gatekeeperNetwork);
        require(verifier.verifyToken(msg.sender));
        _;
    }
}
