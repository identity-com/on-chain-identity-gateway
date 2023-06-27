// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

enum ChargeType {
    NONE, // No charge
    ETH, // Charge amount is in Eth (Wei)
    ERC20 // Charge amount is in an ERC20 token (token field) in minor denomination
}

/**
 * @dev The Charge struct represents details of a charge made to the gatekeeper on
 * gateway token issuance or refresh.
 */
struct Charge {
    // the amount in either wei (if chargeType = ETH) or ERC20 minor denomination (if chargeType = ERC20)
    uint256 value;
    // whether to charge in wei or ERC20
    ChargeType chargeType;
    // if chargeType = ERC20, the token to charge in
    address token;
    // the sender of the funds if chargeType = ERC20. This is necessary as the transaction is forwarded,
    // and the originator of the transaction is not clear inside the GatewayToken contract.
    // More details in ChargeHandler.sol
    address tokenSender;
    // the recipient of the funds. Typically a wallet owned by the gatekeeper.
    address recipient;
}
