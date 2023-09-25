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
    // Mapping of user addresses to their respective internal approval configurations.
    // prettier-ignore
    mapping(
        address userAddress => mapping(
            address gatewayTokenAddress => mapping(
                address erc20TokenAddress => mapping(
                    uint256 network => uint256 tokens
    )))) internal _approvals;

    /**
     * @dev Set a token approval.
     * @param tokenAddress The address of the token to approve.
     * @param tokens The number of tokens to approve.
     * @param network The specific network for which the tokens are approved.
     */
    function _setApproval(address gatewayTokenAddress, address tokenAddress, uint256 tokens, uint256 network) internal {
        _approvals[msg.sender][gatewayTokenAddress][tokenAddress][network] = tokens;
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
        if (_approvals[user][gatewayTokenAddress][tokenAddress][network] < tokens) {
            return (false, _approvals[user][gatewayTokenAddress][tokenAddress][network]);
        }

        _approvals[user][gatewayTokenAddress][tokenAddress][network] -= tokens;
        return (true, _approvals[user][gatewayTokenAddress][tokenAddress][network]);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    // solhint-disable-next-line
    uint256[49] private __gap;
}
