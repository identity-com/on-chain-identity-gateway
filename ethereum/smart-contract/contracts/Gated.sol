// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";

abstract contract Gated {
    address private immutable _gatewayTokenContract;
    uint256 private immutable _gatekeeperNetwork;

    /// The gateway token is not valid.
    error IsGated__InvalidGatewayToken(address gatewayToken);

    /**
     * @dev Modifier to make a function callable only when the caller has a valid gateway token.
     *
     * Requirements:
     *
     * - The caller must have a valid, non-expired gateway token on the _gatekeeperNetwork network.
     */
    modifier gated() {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(_gatewayTokenContract);
        if (!verifier.verifyToken(msg.sender, _gatekeeperNetwork)) {
            revert IsGated__InvalidGatewayToken(_gatewayTokenContract);
        }
        _;
    }

    /**
     * @dev Initializes the contract with a gateway token contract address and a gatekeeper network.
     *
     * Contract functions with the `gated` modifier will only be callable when the caller has a valid,
     * non-expired gateway token on the `gatekeeperNetwork` network using this `gatewayTokenContract`.
     *
     * See {ERC2771Context-constructor}.
     */
    constructor(address gatewayTokenContract, uint256 gatekeeperNetwork) {
        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
    }
}
