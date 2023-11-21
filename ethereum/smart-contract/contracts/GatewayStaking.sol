// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { IGatewayStaking } from "./interfaces/IGatewayStaking.sol";
import { ParameterizedAccessControl } from "./ParameterizedAccessControl.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";


contract GatewayStaking is IGatewayStaking, ParameterizedAccessControl {
   constructor(IERC20 asset_, string memory name_, string memory symbol_) ERC4626(asset_, name_, symbol_) {
      _superAdmins[msg.sender] = true;
   }

   function depositStake(uint256 assests) public override returns(uint256) {
      // Deposit stake using ERC-4626 deposit method
      deposit(assests, msg.sender);
   }

   function withdrawkStake(uint256 assests) public override returns (uint256) {
      // Withdraw stake using ERC-4626 withdraw method
      withdraw(assests, msg.sender, msg.sender);
   }

   function setMinimumGatekeeperStake (uint256 minStakeAmount) public override onlySuperAdmin {
      GLOBAL_MIN_GATEKEEPER_STAKE = minStakeAmount;
   }

   function hasMinimumGatekeeperStake(address staker) public override returns(bool) {
      uint256 stakerBalance = IERC20(asset()).balanceOf(staker);
      return stakerBalance >= GLOBAL_MIN_GATEKEEPER_STAKE;
   }
}