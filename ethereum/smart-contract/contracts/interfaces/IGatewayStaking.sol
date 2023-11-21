// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19;

import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

abstract contract  IGatewayStaking is ERC4626 {

    uint256 public GLOBAL_MIN_GATEKEEPER_STAKE;

    error VaultMethodNotImplemented();

   function depositStake(uint256 assests) public virtual returns (uint256);
   
   /** @dev Attempts to withdraw the specified shares*/
   function withdrawStake(uint256 shares) public virtual returns (uint256);

   function setMinimumGatekeeperStake(uint256 minStakeAmount) pure virtual;

   function hasMinimumGatekeeperStake(address staker) pure virtual returns(bool);

   /**
    * @dev Only allow staking through the deposit method
    */
   function mint(uint256 shares, address receiver) public  override returns (uint256) {
        revert VaultMethodNotImplemented();
    }

    /**
    * @dev Only allow stake withdrawl through the redeem method
    */
    function withdraw( uint256 assets, address receiver, address owner) public override returns (uint256) {
        revert VaultMethodNotImplemented();
    }

    /**
     * @dev Enforce 1:1 conversion of assets to shares. This vault assumes the deposited asset is a stable coin.
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256 shares) {
        return assets;
    }

    /**
     * @dev Enforce 1:1 conversion of shares to assets. This vault assumes the deposited asset is a stable coin.
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256 assets) {
        return shares;
    }

    /** 
     * @dev Users can only redeem up to the amount of shares minted through the depositStake method
     */
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        require(ERC20(address(this)).balanceOf(msg.sender) >= shares, "Message sender does not have enough shares to redeem the requested shares");
        return shares;
    }

}