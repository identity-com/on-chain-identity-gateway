// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { IGatewayStaking } from "./interfaces/IGatewayStaking.sol";
import { ParameterizedAccessControl } from "./ParameterizedAccessControl.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";


contract GatewayStaking is IGatewayStaking, ParameterizedAccessControl {
   constructor(ERC20 asset_, string memory name_, string memory symbol_) ERC4626(asset_) ERC20(name_, symbol_) {
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
      uint256 stakerBalance = ERC20(asset()).balanceOf(staker);
      return stakerBalance >= GLOBAL_MIN_GATEKEEPER_STAKE;
   }

   function _msgSender() internal view override(Context,ContextUpgradeable) returns (address) {
      return Context._msgSender();
   }

   function _msgData() internal view override(Context,ContextUpgradeable) returns (bytes calldata) {
      return Context._msgData();
   }
}