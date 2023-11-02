// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {ERC3525Upgradeable} from "@solvprotocol/erc-3525/ERC3525Upgradeable.sol";
import {Charge} from "../../contracts/library/Charge.sol";
import {GatewayToken} from "../../contracts/GatewayToken.sol";
import {IGatewayNetwork} from "../../contracts/interfaces/IGatewayNetwork.sol";

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
        uint256 mask,
        Charge calldata charge
    ) external payable override(GatewayToken) {
        _checkGatekeeper(network);
        _handleCharge(charge);

        uint256 tokenId = ERC3525Upgradeable._mint(to, network, 1);
        uint expiration = IGatewayNetwork(_gatewayNetworkContract).getNetwork(network).passExpireTimestamp;

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
