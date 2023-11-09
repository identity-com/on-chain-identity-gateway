// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ERC20PresetFixedSupply} from "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetFixedSupply.sol";

/**
 * @dev A stub ERC20 contract used for testing charge handling. This contract is broken, and will always return false
 * when transferFrom is called.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract DummyBrokenERC20 is ERC20PresetFixedSupply {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20PresetFixedSupply(name, symbol, initialSupply, owner) {}

    function transferFrom(address, address, uint256) public virtual override returns (bool) {
        return false;
    }
}
