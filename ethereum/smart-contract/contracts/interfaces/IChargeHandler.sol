// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import {Charge} from "../library/Charge.sol";

interface IChargeHandler {
    event ChargePaid(Charge);

    error Charge__IncorrectAllowance(uint256 allowance, uint256 expectedAllowance);

    error Charge__InsufficientValue(uint256 value, uint256 expectedValue);

    error Charge__TransferFailed(uint256 value);

    function handleCharge(Charge calldata charge, uint network) external payable;
}
