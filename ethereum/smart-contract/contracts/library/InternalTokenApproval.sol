// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InternalTokenApproval
 * @dev This library provides functions to manage token approvals for preventing front-running attacks.
 * Users are required to specifically approve
 * ERC20 spending for a designated gatekeeper network. This is in addition to the general
 * approval given to the GatewayToken contract. The aim is to ensure that malicious actors
 * cannot exploit the process by setting up rogue gatekeeper networks, and then front-running
 * legitimate issuance transactions and siphoning ERC20 tokens from
 * unsuspecting recipients.
 */
library InternalTokenApproval {
    // Struct to represent token approvals for specific networks.
    struct Approval {
        uint256 tokens; // The number of tokens approved.
        uint256 network; // The specific network for which the tokens are approved.
    }

    /**
     * @dev Set a token approval.
     * @param approvals The approvals mapping where the approval details are to be set.
     * @param user The user for which the approval details are to be set.
     * @param tokens The number of tokens to approve.
     * @param network The specific network for which the tokens are approved.
     */
    function setApproval(
        mapping(address => Approval) storage approvals,
        address user,
        uint256 tokens,
        uint256 network
    ) internal {
        approvals[user].tokens = tokens;
        approvals[user].network = network;
    }

    /**
     * @dev Consume a certain amount of the token approval.
     * @param approvals The approval mapping from which the approval details are to be consumed.
     * @param user The user for which the approval details are to be consumed.
     * @param tokens The number of tokens to consume.
     * @param network The specific network from which the tokens are consumed.
     * @return A boolean indicating if the operation was successful.
     */
    function consumeApproval(
        mapping(address => Approval) storage approvals,
        address user,
        uint256 tokens,
        uint256 network
    ) internal returns (bool) {
        if (approvals[user].network != network || approvals[user].tokens < tokens) {
            return false;
        }

        approvals[user].tokens -= tokens;
        return true;
    }
}
