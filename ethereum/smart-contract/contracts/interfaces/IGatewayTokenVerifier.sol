// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IGatewayTokenVerifier {
    /**
    * @dev Triggered by external contract to verify if `slot` and token `owner` are correct.
    *
    * Checks if token exists in gateway token contract, `slot` still active, and not expired.
    * Performs additional checks to verify that `owner` is not blacklisted globally.
    */
    function verifyToken(address owner, uint256 network) external view returns (bool);

    function verifyToken(uint256 tokenId) external view returns (bool);
}