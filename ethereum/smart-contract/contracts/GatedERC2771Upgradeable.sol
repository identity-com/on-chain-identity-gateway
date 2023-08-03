// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IGatewayTokenVerifier} from "./interfaces/IGatewayTokenVerifier.sol";
import {MultiERC2771ContextUpgradeable} from "./MultiERC2771ContextUpgradeable.sol";

abstract contract GatedERC2771Upgradeable is MultiERC2771ContextUpgradeable {
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

    // solhint-disable-next-line func-name-mixedcase
    function __GatedERC2771Upgradeable_init(
        address gatewayTokenContract,
        uint256 gatekeeperNetwork,
        address[] calldata trustedForwarders
    ) internal onlyInitializing {
        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
        __MultiERC2771ContextUpgradeable_init(trustedForwarders);
    }
}
