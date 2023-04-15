// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @dev Context variant with ERC2771 support for multiple trusted forwarders.
 */
abstract contract MultiERC2771Context is ContextUpgradeable {
    mapping(address => bool) private _trustedForwarders;

    /// @custom:oz-upgrades-unsafe-allow constructor
    // solhint-disable-next-line no-empty-blocks
    constructor() initializer {}

    // solhint-disable-next-line func-name-mixedcase
    function __MultiERC2771Context_init(address[] memory trustedForwarders) internal initializer {
        __Context_init_unchained();
        __MultiERC2771Context_init_unchained(trustedForwarders);
    }

    // solhint-disable-next-line func-name-mixedcase
    function __MultiERC2771Context_init_unchained(address[] memory trustedForwarders) internal initializer {
        for (uint i = 0; i < trustedForwarders.length; i++) {
            _trustedForwarders[trustedForwarders[i]] = true;
        }
    }

    // The overridden function should declare the appropriate access control//
    // keep init functions at the top by the constructor
    // solhint-disable-next-line ordering
    function addForwarder(address forwarder) public virtual {
        _trustedForwarders[forwarder] = true;
    }

    // The overridden function should declare the appropriate access control
    function removeForwarder(address forwarder) public virtual {
        _trustedForwarders[forwarder] = false;
    }

    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return _trustedForwarders[forwarder];
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            // solhint-disable-next-line no-inline-assembly
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return super._msgSender();
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return super._msgData();
        }
    }
}
