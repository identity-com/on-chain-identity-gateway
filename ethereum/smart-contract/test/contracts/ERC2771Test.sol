// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {MultiERC2771Context} from "../../contracts/MultiERC2771Context.sol";

/**
 * @dev An example client contract, used to test MultiERC2771Context.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract ERC2771Test is MultiERC2771Context {
    event MsgSender(address);
    event MsgData(bytes);

    constructor(address[] memory forwarders) MultiERC2771Context(forwarders) {}

    function addForwarder(address forwarder) external {
        _addForwarder(forwarder);
    }

    function removeForwarder(address forwarder) external {
        _removeForwarder(forwarder);
    }

    function getMsgSender() external returns (address) {
        emit MsgSender(super._msgSender());
        return super._msgSender();
    }

    function getMsgData() external {
        emit MsgData(super._msgData());
    }

    function getMsgDataWithArg(uint) external {
        emit MsgData(super._msgData());
    }
}
