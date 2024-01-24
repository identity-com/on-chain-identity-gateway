// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

/**
 * @dev A stub contract with a broken receive function
 */
contract DummyBrokenEthRecipient {
    receive() external payable {
        revert("DummyBrokenEthRecipient: receive function intentionally reverted");
    }
}
