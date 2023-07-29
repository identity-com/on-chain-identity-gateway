// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {GatedERC2771} from "../../contracts/GatedERC2771.sol";

/**
 * @dev An example client contract, used to test the Gated modifier.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenClientERC2771Test is GatedERC2771 {
    event Success();

    constructor(
        address gatewayTokenContract,
        uint256 gatekeeperNetwork
    ) GatedERC2771(gatewayTokenContract, gatekeeperNetwork) {}

    /**
     * @dev A public version of _msgData() in the GatewayToken contract, use for testing the forwarding logic.
     */
    function testGated() external gated {
        emit Success();
    }
}
