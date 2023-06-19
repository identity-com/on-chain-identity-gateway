import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';
import { ethers, upgrades } from 'hardhat';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, upgrades } = hre;
  const gatewayTokenFactory = await ethers.getContractFactory('GatewayToken');
  const deployedGatewayToken = await deployments.get('GatewayTokenProxy');
  await upgrades.forceImport(deployedGatewayToken.address, gatewayTokenFactory);
  await upgrades.upgradeProxy(deployedGatewayToken, gatewayTokenFactory);

  console.log('upgraded GatewayToken at ' + deployedGatewayToken.address);
};

export default func;
func.id = 'upgrade_v1';
func.tags = ['UpgradeV1'];
func.dependencies = [];
