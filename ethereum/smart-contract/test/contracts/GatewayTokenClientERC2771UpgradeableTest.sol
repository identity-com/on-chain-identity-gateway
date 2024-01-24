// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {GatedERC2771} from "../../contracts/GatedERC2771.sol";
import "../../contracts/GatedERC2771Upgradeable.sol";

/**
 * @dev An example client contract, used to test the Gated modifier.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenClientERC2771UpgradeableTest is GatedERC2771Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    event Success();

    function initialize(
        address gatewayTokenContract,
        uint256 gatekeeperNetwork,
        address[] calldata trustedForwarders
    ) external initializer {
        __GatedERC2771Upgradeable_init(gatewayTokenContract, gatekeeperNetwork, trustedForwarders);
    }

    function testGated() external gated {
        emit Success();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _msgSender()
        internal
        view
        virtual
        override(MultiERC2771ContextUpgradeable, ContextUpgradeable)
        returns (address sender)
    {
        return MultiERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(MultiERC2771ContextUpgradeable, ContextUpgradeable)
        returns (bytes calldata)
    {
        return MultiERC2771ContextUpgradeable._msgData();
    }
}
