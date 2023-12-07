import { ethers } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { 
    GatewayStaking,
    GatewayStaking__factory,
    DummyERC20,
    DummyERC20__factory,
} from '../typechain-types' ;

import { BigNumberish } from 'ethers';

describe('Gateway Staking', () => {
    let bob: SignerWithAddress;
    let deployer: SignerWithAddress;
    let alice: SignerWithAddress;

    let gatewayStakingContract: GatewayStaking;
    let dummyAssetContract: DummyERC20

    const giveDummyToken = async (account: SignerWithAddress, amountToTransfer: BigNumberish) => {
        await dummyAssetContract.connect(deployer).transfer(account.address, amountToTransfer);
    }


    beforeEach('setup', async () => {
        [deployer, bob, alice] = await ethers.getSigners();

        const gatewayStakingFactory = await new GatewayStaking__factory(deployer);
        const erc20Factory = await new DummyERC20__factory(deployer);

        dummyAssetContract = await erc20Factory.deploy('DummyToken', 'DT', 10000000000, deployer.address);
        await dummyAssetContract.deployed();

        gatewayStakingContract = await gatewayStakingFactory.deploy(dummyAssetContract.address, 'GatewayProtocolShares', 'GPS');
        await gatewayStakingContract.deployed();
    })

    describe('- Assets to shares', async () => {
        it('should be converted in 1:1 ratio', async () => {
            const assets = 500;
            const calculatedShares = await gatewayStakingContract.previewDeposit(assets);
            expect(calculatedShares).to.be.eq(assets);
        });
    })

    describe('- Shares to assets', async () => {
        it('should be converted in 1:1 ratio if message sender has enough shares', async () => {
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});
            const amountOfRedeemableShares = await gatewayStakingContract.connect(bob).previewRedeem(assetAmount, {gasLimit: 300000});

            expect(amountOfRedeemableShares).to.be.eq(assetAmount);
        });

        it('should fail to convert shares to assets if message sender does not have enough shares', async () => {
            const assets = 500;
            await expect(gatewayStakingContract.connect(bob).previewRedeem(assets)).to.be.rejectedWith("Message sender does not have enough shares to redeem the requested shares");
        });
    })

    describe('- gatekeeper staking admin', async () => {
        it('default minimum gatekeeper stake', async () => {
            expect(await gatewayStakingContract.GLOBAL_MIN_GATEKEEPER_STAKE()).to.be.eq(0);
        });

        it('should be able to set minimum gatekeeper stake', async () => {
            const minAssetAmount = 500;
            await gatewayStakingContract.connect(deployer).setMinimumGatekeeperStake(minAssetAmount, {gasLimit: 300000});

            expect(await gatewayStakingContract.GLOBAL_MIN_GATEKEEPER_STAKE()).to.be.eq(minAssetAmount);
        });

        it('should not be able to set minimum gatekeeper stake of not contract admin', async () => {
            const minAssetAmount = 500;
            await gatewayStakingContract.connect(deployer).setMinimumGatekeeperStake(minAssetAmount, {gasLimit: 300000});

            expect(await gatewayStakingContract.GLOBAL_MIN_GATEKEEPER_STAKE()).to.be.eq(minAssetAmount);

            await expect(gatewayStakingContract.connect(bob).setMinimumGatekeeperStake(minAssetAmount, {gasLimit: 300000})).to.be.revertedWithCustomError(gatewayStakingContract, 'Common__NotSuperAdmin');
        });
    })

    describe('- vault operations', async () => {
        it('should allow a user to deposit assests and receive an equal amount of shares', async () => {
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});

            const sharesBalance = await gatewayStakingContract.balanceOf(bob.address);

            expect(sharesBalance).to.be.eq(assetAmount);
        });

        it('should allow a user to deposit assests and receive an equal amount of shares using the ERC-4626 deposit method', async () => {
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).deposit(assetAmount, bob.address, {gasLimit: 300000});

            const sharesBalance = await gatewayStakingContract.balanceOf(bob.address);

            expect(sharesBalance).to.be.eq(assetAmount);
        });

        it('should allow a user withdraw deposited shares', async () => {
            // given
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(0);

            // when
            await gatewayStakingContract.connect(bob).withdrawStake(assetAmount, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(assetAmount);
            expect(await gatewayStakingContract.balanceOf(bob.address)).to.eq(0);
        });

        it('should allow a user withdraw deposited shares with ERC-4626 redeem method', async () => {
            // given
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(0);

            // when
            await gatewayStakingContract.connect(bob).redeem(assetAmount, bob.address, bob.address, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(assetAmount);
            expect(await gatewayStakingContract.balanceOf(bob.address)).to.eq(0);
        });

        it('should allow a user to withdraw deposited shares over multiple transactions', async () => {
            // given
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(0);

            // when
            await gatewayStakingContract.connect(bob).withdrawStake(assetAmount/2, {gasLimit: 300000});
            await gatewayStakingContract.connect(bob).withdrawStake(assetAmount/2, {gasLimit: 300000});

            expect(await dummyAssetContract.balanceOf(bob.address)).to.eq(assetAmount);
            expect(await gatewayStakingContract.balanceOf(bob.address)).to.eq(0);
        });

        it('should not allow a user to withdraw more shares than deposited in vault', async () => {
            // given
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});

            await expect(gatewayStakingContract.connect(bob).withdrawStake(assetAmount * 2, {gasLimit: 300000})).to.be.rejectedWith("ERC4626: redeem more than max");
        });

        it('should not allow a user to withdraw more shares than they deposited into vault', async () => {
            // given
            const assetAmount = 500;
            await giveDummyToken(bob, assetAmount);
            await giveDummyToken(alice, assetAmount);

            // give staking contract allowance 
            await dummyAssetContract.connect(bob).increaseAllowance(gatewayStakingContract.address, assetAmount);
            await dummyAssetContract.connect(alice).increaseAllowance(gatewayStakingContract.address, assetAmount);

            await gatewayStakingContract.connect(bob).depositStake(assetAmount, {gasLimit: 300000});
            await gatewayStakingContract.connect(alice).depositStake(assetAmount, {gasLimit: 300000});

            await expect(gatewayStakingContract.connect(bob).withdrawStake(assetAmount * 2, {gasLimit: 300000})).to.be.rejectedWith("ERC4626: redeem more than max");
        });

        it('should not allow a user to withdraw shares through the ERC-4626 withdraw method', async () => {
            await expect(gatewayStakingContract.connect(bob).withdraw(500, bob.address, bob.address)).to.be.revertedWithCustomError(gatewayStakingContract, 'VaultMethodNotImplemented');
        });

        it('should not allow a user to deposit shares through the ERC-4626 mint method', async () => {
            await expect(gatewayStakingContract.connect(bob).mint(500, bob.address)).to.be.revertedWithCustomError(gatewayStakingContract, 'VaultMethodNotImplemented');
        });
    })
})