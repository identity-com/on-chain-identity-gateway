// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

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

    function testGated() external gated {
        emit Success();
    }
}
