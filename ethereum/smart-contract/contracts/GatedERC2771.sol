// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";
import {MultiERC2771ContextNonUpgradeable} from "./MultiERC2771ContextNonUpgradeable.sol";

abstract contract GatedERC2771 is MultiERC2771ContextNonUpgradeable {
    address private _gatewayTokenContract;
    uint256 private _gatekeeperNetwork;

    /// The gateway token is not valid.
    error IsGated__InvalidGatewayToken(address gatewayToken);

    modifier gated() {
        IGatewayTokenVerifier verifier = IGatewayTokenVerifier(_gatewayTokenContract);
        if (!verifier.verifyToken(_msgSender(), _gatekeeperNetwork)) {
            revert IsGated__InvalidGatewayToken(_gatewayTokenContract);
        }
        _;
    }

    constructor(
        address gatewayTokenContract,
        uint256 gatekeeperNetwork
    ) MultiERC2771ContextNonUpgradeable(new address[](0)) {
        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
    }
}
