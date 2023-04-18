// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {GatewayToken} from "./GatewayToken.sol";
import {Charge} from "./library/Charge.sol";
import {ERC3525Upgradeable} from "@solvprotocol/erc-3525/ERC3525Upgradeable.sol";
import {console} from "hardhat/console.sol";

/**
 * @dev An extension of the GatewayToken.sol, used to test internal functions of a contract.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenInternalsTest is GatewayToken {
    event MsgData(bytes);
    event MsgSender(address);

    /**
     * @dev A public version of _msgData() in the GatewayToken contract, use for testing the forwarding logic.
     */
    function getMsgData(uint x) external virtual {
        console.log("Called getMsgData(%d)", x);
        emit MsgData(super._msgData());
    }

    /**
     * @dev A public version of _msgSender() in the GatewayToken contract, use for testing the forwarding logic.
     */
    function getMsgSender() external virtual {
        console.log("Called getMsgSender()");
        emit MsgSender(super._msgSender());
    }
}
