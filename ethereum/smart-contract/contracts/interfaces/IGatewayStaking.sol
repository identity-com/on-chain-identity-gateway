// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

abstract contract  IGatewayStaking is ERC4626 {

    uint256 public GLOBAL_MIN_GATEKEEPER_STAKE;

    error VaultMethodNotImplemented();

   function depositStake(uint256 assests) public virtual returns (uint256);
   function withdrawkStake(uint256 assests) public virtual returns (uint256);

   function setMinimumGatekeeperStake(uint256 minStakeAmount) public virtual;

   function hasMinimumGatekeeperStake(address staker) public virtual returns(bool);
   
   /**
    * @dev Only allow staking through the deposit method
    */
   function mint(uint256 shares, address receiver) public  override returns (uint256) {
        revert VaultMethodNotImplemented();
    }

    /**
    * @dev Only allow stake withdrawl through the withdraw method
    */
    function redeem( uint256 shares, address receiver, address owner) public override returns (uint256) {
        revert VaultMethodNotImplemented();
    }

}