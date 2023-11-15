import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, upgrades } = hre;
  const gatewayTokenFactory = await ethers.getContractFactory('GatewayTokenV0');
  const deployedGatewayToken = await deployments.get('GatewayTokenProxy');
  await upgrades.forceImport(deployedGatewayToken.address, gatewayTokenFactory);

  console.log('force imported GatewayToken at ' + deployedGatewayToken.address);

  const flagsStorageFactory = await ethers.getContractFactory('FlagsStorage');
  const deployedFlagsStorage = await deployments.get('FlagsStorageProxy');
  await upgrades.forceImport(deployedFlagsStorage.address, flagsStorageFactory);

  console.log('force imported FlagsStorage at ' + deployedFlagsStorage.address);
};

export default func;
func.id = 'upgrade_import';
func.tags = ['UpgradeImport'];
func.dependencies = [];
