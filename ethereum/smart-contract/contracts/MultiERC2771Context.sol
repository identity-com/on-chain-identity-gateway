// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @dev Context variant with ERC2771 support for multiple trusted forwarders.
 */
abstract contract MultiERC2771Context is ContextUpgradeable {
    mapping(address => bool) private _trustedForwarders;

    // because MultiERC2771Context is abstract we don't implement a
    // constructor. It's the responsibility of the derived contract to
    // disable the Initializers with "_disableInitializers()"

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

    // solhint-disable-next-line ordering
    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return _trustedForwarders[forwarder];
    }

    // The overridden function should declare the appropriate access control//
    // keep init functions at the top by the constructor
    function _addForwarder(address forwarder) internal virtual {
        _trustedForwarders[forwarder] = true;
    }

    // The overridden function should declare the appropriate access control
    function _removeForwarder(address forwarder) internal virtual {
        _trustedForwarders[forwarder] = false;
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
