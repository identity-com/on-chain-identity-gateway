// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {Gated} from "./Gated.sol";

/**
 * @dev An example client contract, used to test the Gated modifier.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenClientTest is Gated {
    event Success();

    address private _gatewayTokenContract;
    uint256 private _gatekeeperNetwork;

    constructor(address gatewayTokenContract, uint256 gatekeeperNetwork) {
        _gatewayTokenContract = gatewayTokenContract;
        _gatekeeperNetwork = gatekeeperNetwork;
    }
    /**
     * @dev A public version of _msgData() in the GatewayToken contract, use for testing the forwarding logic.
     */
    function testGated() external virtual gated(_gatewayTokenContract, _gatekeeperNetwork) {
        emit Success();
    }
}
