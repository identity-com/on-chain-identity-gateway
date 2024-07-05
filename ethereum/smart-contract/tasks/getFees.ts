import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const getFees = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts, deployments } = hre;

  const [deployer] = await ethers.getSigners();

  const toGwei = (wei: bigint) => ethers.formatUnits(wei, "gwei")

  const fees = await deployer.getFeeData();

  if (fees.maxFeePerGas) console.log(`maxFeePerGas ${toGwei(fees.maxFeePerGas).toString()} gwei (${fees.maxFeePerGas.toString()} wei)`);
  if (fees.maxPriorityFeePerGas) console.log(`maxPriorityFeePerGas ${toGwei(fees.maxPriorityFeePerGas).toString()} gwei (${fees.maxPriorityFeePerGas.toString()} wei)`);
  if (fees.gasPrice) console.log(`maxFeePerGas ${toGwei(fees.gasPrice).toString()} gwei (${fees.gasPrice.toString()} wei)`);
};
