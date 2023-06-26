// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {Gated} from "../../contracts/Gated.sol";

/**
 * @dev An example client contract, used to test the Gated modifier.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenClientTest is Gated {
    event Success();

    constructor(
        address gatewayTokenContract,
        uint256 gatekeeperNetwork
    ) Gated(gatewayTokenContract, gatekeeperNetwork) {}

    /**
     * @dev A public version of _msgData() in the GatewayToken contract, use for testing the forwarding logic.
     */
    function testGated() external gated {
        emit Success();
    }
}
