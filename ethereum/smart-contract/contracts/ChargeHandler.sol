// SPDX-License-Identifier: MIT
pragma solidity 0.8.19; // Fixed version for concrete contracts

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Charge, ChargeType} from "./library/Charge.sol";
import {InternalTokenApproval} from "./library/InternalTokenApproval.sol";
import {IChargeHandler} from "./interfaces/IChargeHandler.sol";
import {Common__MissingAccount} from "./library/CommonErrors.sol";

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
contract ChargeHandler is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    IChargeHandler,
    InternalTokenApproval
{
    using SafeERC20 for IERC20;
    bytes32 public constant CHARGE_CALLER_ROLE = keccak256("CHARGE_CALLER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    // empty constructor in line with the UUPS upgradeable proxy pattern
    // solhint-disable-next-line no-empty-blocks
    constructor() {
        _disableInitializers();
    }

    function initialize(address owner) external initializer {
        if (owner == address(0)) revert Common__MissingAccount();

        __AccessControl_init();
        __UUPSUpgradeable_init();

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
    }

    function setRole(bytes32 role, address recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setupRole(role, recipient);
    }

    /**
     * @dev Send a fee either in ETH (wei) or ERC20 to the gatekeeper.
     * Note, ERC20 requires that the sender has approved the amount.
     * This function uses the CEI (checks-effects-interactions) pattern to avoid reentrancy
     * when sending ETH to the recipient (if the recipient is a smart contract)
     * @param charge The charge details
     **/
    function handleCharge(Charge memory charge, uint network) external payable onlyRole(CHARGE_CALLER_ROLE) {
        if (charge.chargeType == ChargeType.ETH) {
            _handleEthCharge(charge);
        } else if (charge.chargeType == ChargeType.ERC20) {
            _handleERC20Charge(charge, network);
        }
    }

    function setApproval(address gatewayTokenAddress, address tokenAddress, uint256 tokens, uint256 network) external {
        _setApproval(gatewayTokenAddress, tokenAddress, tokens, network);
        emit ApprovalSet(gatewayTokenAddress, tokenAddress, tokens, network);
    }

    function _handleEthCharge(Charge memory charge) internal {
        // CHECKS
        // send wei if the charge type is ETH
        if (msg.value != charge.value) {
            revert Charge__IncorrectValue(msg.value, charge.value);
        }

        // EFFECTS
        emit ChargePaid(charge);

        // INTERACTIONS
        (bool success, ) = payable(charge.partiesInCharge.recipient).call{value: charge.value}("");
        if (!success) {
            revert Charge__TransferFailed(charge.value);
        }
    }

    function _handleERC20Charge(Charge memory charge, uint network) internal {
        if (msg.value > 0) {
            // if the charge type is ERC20, the eth value should be zero
            revert Charge__IncorrectValue(msg.value, 0);
        }
        // send tokens if the charge type is ERC20
        IERC20 token = IERC20(charge.token);

        // CHECKS
        // check that the sender has approved the token transfer from this particular gatekeeper network
        // note - for security's sake, the user has to approve the tokens to a particular
        // gatekeeper network, to avoid front-running attacks. For more details, see
        // InternalTokenApproval.sol
        // Note - safeTransferFrom() additionally checks the global allowance for this contract.
        (bool approvalValid, uint256 remainingAllowance) = _consumeApproval(
            charge.partiesInCharge.tokenSender,
            _msgSender(),
            charge.token,
            charge.value,
            network
        );
        if (!approvalValid) {
            revert Charge__IncorrectAllowance(remainingAllowance, charge.value);
        }

        // EFFECTS
        emit ChargePaid(charge);

        // INTERACTIONS
        token.safeTransferFrom(charge.partiesInCharge.tokenSender, charge.partiesInCharge.recipient, charge.value);
    }

    // includes the onlySuperAdmin modifier to ensure that only the super admin can call this function
    // otherwise, no other logic.
    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
