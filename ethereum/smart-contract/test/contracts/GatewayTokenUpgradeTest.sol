// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {IERC3525MetadataUpgradeable} from "@solvprotocol/erc-3525/extensions/IERC3525MetadataUpgradeable.sol";
import {ERC3525Upgradeable} from "@solvprotocol/erc-3525/ERC3525Upgradeable.sol";
import {IERC721} from "@solvprotocol/erc-3525/IERC721.sol";
import {IERC3525} from "@solvprotocol/erc-3525/IERC3525.sol";
import {TokenBitMask} from "../../contracts/TokenBitMask.sol";
import {IGatewayToken} from "../../contracts/interfaces/IGatewayToken.sol";
import {IERC721Freezable} from "../../contracts/interfaces/IERC721Freezable.sol";
import {IERC721Expirable} from "../../contracts/interfaces/IERC721Expirable.sol";
import {IERC721Revokable} from "../../contracts/interfaces/IERC721Revokable.sol";
import {MultiERC2771Context} from "../../contracts/MultiERC2771Context.sol";
import {Charge} from "../../contracts/library/Charge.sol";
import {ParameterizedAccessControl} from "../../contracts/ParameterizedAccessControl.sol";
import {
    Common__MissingAccount,
    Common__NotContract,
    Common__Unauthorized
} from "../../contracts/library/CommonErrors.sol";
import {GatewayToken} from "../../contracts/GatewayToken.sol";

/**
 * @dev An extension of the GatewayToken.sol, used to test the upgradeability of the contract.
 * NOTE: DO NOT DEPLOY THIS CONTRACT. It should be deployed locally by the test suite only.
 */
contract GatewayTokenUpgradeTest is GatewayToken {
    /**
     * @dev A changed version of mint() in the GatewayToken contract which enforces non-zero expiry
     * @param to Gateway token owner
     * @param network Gateway token type
     * @param mask The bitmask for the token
     * @param charge The charge to be paid
     */
    function mint(
        address to,
        uint256 network,
        uint256 expiration,
        uint256 mask,
        Charge calldata charge
    ) external payable override(GatewayToken) {
        _checkGatekeeper(network);
        _handleCharge(charge);

        uint256 tokenId = ERC3525Upgradeable._mint(to, network, 1);

        // THIS IS THE ONLY CHANGE IN THE CONTRACT COMPARED TO GatewayToken.sol
        // Enforces positive expiry times i.e. cannot set to zero
        // This is just to test the upgrade feature
        require(expiration > 0, "TEST MODE: Expiry must be > zero");

        _expirations[tokenId] = expiration;

        if (mask > 0) {
            _setBitMask(tokenId, mask);
        }
    }
}
