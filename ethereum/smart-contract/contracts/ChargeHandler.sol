// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Charge, ChargeType} from "./library/Charge.sol";

/**
 * @dev The ChargeHandler contract is an internal library used by the Gatekeeper
 * to handle charges made to the gatekeeper on gateway token issuance or refresh.
 *
 * The charge functionality operates in conjunction with the forwarder to allow a transaction to be
 * a) signed by a gatekeeper, but
 * b) sent from a gateway token recipient
 * This is necessary for the ETH charge type, as the charge payer must sign the transaction. For ERC20
 * transactions, it is sufficient for the charge payer to sign an approval transaction beforehand.
 *
 * Note: The sender address of the charge can differ between the ETH and ERC20 charge types.
 * ETH: The funds are sent via the "value" property of an eth transaction, and are forwarded on to the
 * recipient address.
 * ERC20: The sender address is specified as `tokenSender` in the Charge object. This will typically be,
 * the gateway token recipient, but it can be any address. Setting this value explicitly is necessary, as
 * it cannot be reliably derived from within the GatewayToken contract. Options would be:
 * _msgSender() (ERC2771) - This is the inner transaction sender - the gatekeeper
 * msg.sender - This is the forwarder contract
 * tx.origin - This is the EOA (Externally Owned Account) that signed the outer transaction. While this is
 * typically the gateway token recipient, using tx.origin precludes the use of smart contract wallets, as well as
 * being discouraged for other security reasons.
 */
contract ChargeHandler {
    event ChargePaid(Charge);

    error Charge__InsufficientAllowance(uint256 allowance, uint256 expectedAllowance);

    error Charge__InsufficientValue(uint256 value, uint256 expectedValue);

    error Charge__TransferFailed(uint256 value);

    /**
     * @dev Send a fee either in ETH (wei) or ERC20 to the gatekeeper.
     * Note, ERC20 requires that the sender has approved the amount.
     * This function uses the CEI (checks-effects-interactions) pattern to avoid reentrancy
     * when sending ETH to the recipient (if the recipient is a smart contract)
     * @param charge The charge details
     **/
    function _handleCharge(Charge calldata charge) internal {
        if (charge.chargeType == ChargeType.ETH) {
            // CHECKS
            // send wei if the charge type is ETH
            if (msg.value < charge.value) {
                revert Charge__InsufficientValue(msg.value, charge.value);
            }

            // EFFECTS
            emit ChargePaid(charge);

            // INTERACTIONS
            (bool success, ) = payable(charge.recipient).call{value: charge.value}("");
            if (!success) {
                revert Charge__TransferFailed(charge.value);
            }
        } else if (charge.chargeType == ChargeType.ERC20) {
            // send tokens if the charge type is ERC20
            IERC20 token = IERC20(charge.token);

            // CHECKS
            // check that the sender has approved the token transfer
            uint256 allowance = token.allowance(charge.tokenSender, address(this));
            if (allowance < charge.value) {
                revert Charge__InsufficientAllowance(allowance, charge.value);
            }

            // EFFECTS
            emit ChargePaid(charge);

            // INTERACTIONS
            bool success = token.transferFrom(charge.tokenSender, charge.recipient, charge.value);
            if (!success) {
                revert Charge__TransferFailed(charge.value);
            }
        }
    }
}
