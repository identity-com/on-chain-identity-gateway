// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ERC20PresetFixedSupply} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

/**
 * @dev A stub ERC20 contract used for testing charge handling.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract DummyERC20 is ERC20PresetFixedSupply {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20PresetFixedSupply(name, symbol, initialSupply, owner) {}
}
