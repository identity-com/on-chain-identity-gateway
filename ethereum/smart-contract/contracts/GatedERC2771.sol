// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";
import {MultiERC2771Context} from "./MultiERC2771Context.sol";

abstract contract GatedERC2771 is MultiERC2771Context {
    address private immutable _gatewayTokenContract;
    uint256 private immutable _gatekeeperNetwork;

    /// The gateway token is not valid.
    error IsGated__InvalidGatewayToken(address gatewayToken);
    /// The gateway token contract address is zero.
    error IsGated__ZeroContractAddress();

    /**
     * @dev Modifier to make a function callable only when the caller has a valid gateway token.
     *
     * Requirements:
     *
     * - The caller must have a valid, non-expired gateway token on the _gatekeeperNetwork network.
     */
    modifier gated() {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(_gatewayTokenContract);
        if (!verifier.verifyToken(_msgSender(), _gatekeeperNetwork)) {
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
    constructor(address gatewayTokenContract, uint256 gatekeeperNetwork) MultiERC2771Context(new address[](0)) {
        // check for zero address
        if (gatewayTokenContract == address(0)) {
            revert IsGated__ZeroContractAddress();
        }

        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
    }
}
