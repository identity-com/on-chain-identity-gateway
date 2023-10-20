// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {MultiERC2771Context} from "../../contracts/MultiERC2771Context.sol";
import {console} from "hardhat/console.sol";

/**
 * @dev An example client contract, used to test MultiERC2771Context.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract ERC2771Test is MultiERC2771Context {
    constructor(address[] memory forwarders) MultiERC2771Context(forwarders) {}

    function addForwarder(address forwarder) external {
        _addForwarder(forwarder);
    }

    function getMsgSender() external view returns (address) {
        console.log("ERC2771Test msg.sender: %s", super._msgSender());
        return super._msgSender();
    }
}
