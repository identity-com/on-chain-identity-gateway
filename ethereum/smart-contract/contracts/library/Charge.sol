// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

enum ChargeType {
    NONE, // No charge
    ETH, // Charge amount is in Eth (Wei)
    ERC20 // Charge amount is in an ERC20 token (token field) in minor denomination
}

enum FeeType {
    ISSUE,
    REFRESH,
    EXPIRE,
    VERIFY,
    FREEZE
}

/**
 * @dev The Charge struct represents details of a charge made to the gatekeeper on
 * gateway token issuance or refresh.
 */
struct Charge {
    // the fee amount in either wei (if chargeType = ETH) or ERC20 minor denomination (if chargeType = ERC20)
    uint256 value;
    // The percentage of the fee that will be transfered to the network in bps
    uint16 networkFeeBps;
    // whether to charge in wei or ERC20
    ChargeType chargeType;
    // if chargeType = ERC20, the token to charge in
    address token;
    
    ChargeParties partiesInCharge;
}

struct ChargeParties {
    // the sender of the funds if the fee is paid with an ERC20. This is necessary as the transaction is forwarded,
    // and the originator of the transaction is not clear inside the GatewayToken contract.
    // More details in ChargeHandler.sol
    address tokenSender;
    // the recipient of the funds. Typically a wallet owned by the gatekeeper.
    address recipient;
}
