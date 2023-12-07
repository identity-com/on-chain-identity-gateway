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
      require(assests > 0, "Must deposit assets to receive shares");
      deposit(assests, msg.sender);
   }

   function withdrawStake(uint256 shares) public override returns (uint256) {
      // checks
      require(shares > 0, "Must burn shares to receive assets");

      // Redeem stake using ERC-4626 redeem method
      redeem(shares, msg.sender, msg.sender);
   }

   function setMinimumGatekeeperStake (uint256 minStakeAmount) public override onlySuperAdmin {
      GLOBAL_MIN_GATEKEEPER_STAKE = minStakeAmount;
   }

   function hasMinimumGatekeeperStake(address staker) public view override returns(bool) {
      return ERC20(address(this)).balanceOf(staker) >= GLOBAL_MIN_GATEKEEPER_STAKE;
   }

   /**
    * @dev These overrides can be removed once this contract is upgradeble
    */
   function _msgSender() internal view override(Context,ContextUpgradeable) returns (address) {
      return Context._msgSender();
   }

   function _msgData() internal view override(Context,ContextUpgradeable) returns (bytes calldata) {
      return Context._msgData();
   }
}