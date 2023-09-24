// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InternalTokenApproval
 * @dev This contract manages token approvals for preventing front-running attacks.
 * Users are required to specifically approve
 * ERC20 spending for a designated gatekeeper network. This is in addition to the general
 * approval given to the GatewayToken contract. The aim is to ensure that malicious actors
 * cannot exploit the process by setting up rogue gatekeeper networks, and then front-running
 * legitimate issuance transactions and siphoning ERC20 tokens from
 * unsuspecting recipients.
 */
contract InternalTokenApproval {
    // Struct to represent token approvals for specific networks.
    struct Approval {
        uint256 tokens; // The number of tokens approved.
        uint256 network; // The specific network for which the tokens are approved.
    }

    // Mapping of user addresses to their respective internal approval configurations.
    // The mapping is structured as follows:
    // userAddress => gatewayTokenAddress => ERC20TokenAddress => Approval
    mapping(address => mapping(address => mapping(address => InternalTokenApproval.Approval))) internal _approvals;

    /**
     * @dev Set a token approval.
     * @param tokenAddress The address of the token to approve.
     * @param tokens The number of tokens to approve.
     * @param network The specific network for which the tokens are approved.
     */
    function _setApproval(address gatewayTokenAddress, address tokenAddress, uint256 tokens, uint256 network) internal {
        _approvals[msg.sender][gatewayTokenAddress][tokenAddress].tokens = tokens;
        _approvals[msg.sender][gatewayTokenAddress][tokenAddress].network = network;
    }

    /**
     * @dev Consume a certain amount of the token approval.
     * @param user The user for which the approval details are to be consumed.
     * @param gatewayTokenAddress The address of the gateway token contract that the tokens are approved to be drwan by.
     * @param tokenAddress The address of the token being spent.
     * @param tokens The number of tokens to consume.
     * @param network The specific network from which the tokens are consumed.
     * @return A boolean indicating if the operation was successful.
     */
    function _consumeApproval(
        address user,
        address gatewayTokenAddress,
        address tokenAddress,
        uint256 tokens,
        uint256 network
    ) internal returns (bool, uint256) {
        if (
            _approvals[user][gatewayTokenAddress][tokenAddress].network != network ||
            _approvals[user][gatewayTokenAddress][tokenAddress].tokens < tokens
        ) {
            return (false, _approvals[user][gatewayTokenAddress][tokenAddress].tokens);
        }

        _approvals[user][gatewayTokenAddress][tokenAddress].tokens -= tokens;
        return (true, _approvals[user][gatewayTokenAddress][tokenAddress].tokens);
    }
}
