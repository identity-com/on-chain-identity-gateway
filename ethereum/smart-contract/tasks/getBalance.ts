import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const getBalance = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts, deployments } = hre;

  const [deployer] = await ethers.getSigners();
  const balance = await deployer.getBalance();

  // Convert the balance from wei to ether and log it
  console.log('Deployer address:', deployer.address);
  console.log('Balance:', ethers.utils.formatEther(balance));
};
