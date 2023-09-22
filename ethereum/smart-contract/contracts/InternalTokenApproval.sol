// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title InternalTokenApproval
 * @dev This contract serves as a protective measure against potential front-running attacks
 * within the GatewayToken contract. Users are required to specifically approve
 * ERC20 spending for a designated gatekeeper network. This is in addition to the general
 * approval given to the GatewayToken contract. The aim is to ensure that malicious actors
 * cannot exploit the process by setting up rogue gatekeeper networks, and then front-running
 * legitimate issuance transactions and siphoning ERC20 tokens from
 * unsuspecting recipients.
 */
contract InternalTokenApproval {
    // Define the tuple representing the approved token amount and network ID
    struct ApprovalForNetwork {
        uint256 tokens;  // Amount of tokens approved
        uint256 network; // ID of the approved gatekeeper network
    }

    // Mapping of user addresses to their respective approval configurations
    mapping(address => ApprovalForNetwork) public approvals;

    /**
     * @notice Set the approval details for the calling user.
     * @dev This function allows a user to set their token and network approval details.
     * Only the respective user can invoke this function for their own address.
     * @param _tokens The amount of tokens to approve.
     * @param _network The ID of the gatekeeper network for approval.
     */
    function setApproval(uint256 _tokens, uint256 _network) public {
        ApprovalForNetwork memory approval = ApprovalForNetwork({
            tokens: _tokens,
            network: _network
        });
        approvals[msg.sender] = approval;
    }

    /**
     * @notice Fetch the approval details for a given user.
     * @param _user The address of the user whose approval details are to be retrieved.
     * @return The amount of approved tokens and the ID of the approved gatekeeper network.
     */
    function getApproval(address _user) public view returns (uint256, uint256) {
        ApprovalForNetwork memory approval = approvals[_user];
        return (approval.tokens, approval.network);
    }

    /**
     * @notice Consume a user's approved tokens for a given gatekeeper network.
     * @dev This function reduces the approved token amount for a user by the specified
     * value and checks for sufficient approval. Warning - the return value must be checked!
     * @param _user The address of the user whose tokens are being consumed.
     * @param _tokens The amount of tokens to consume.
     * @param _network The ID of the gatekeeper network for which the tokens are being consumed.
     */
    function consumeApproval(address _user, uint256 _tokens, uint256 _network) internal returns (bool) {
        ApprovalForNetwork storage userApproval = approvals[_user];

        if(userApproval.network != _network || userApproval.tokens < _tokens) {
            return false;
        }

        userApproval.tokens -= _tokens;
        return true;
    }
}