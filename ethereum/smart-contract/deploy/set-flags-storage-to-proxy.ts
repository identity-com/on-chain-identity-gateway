import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';

/**
 * The initial contract deployments set the flags storage address to the direct address of the flags storage contract,
 * instead of the proxy address. This is incorrect, and we rectify this here.
 * @param hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, upgrades } = hre;
  const deployedGatewayToken = await deployments.get('GatewayTokenProxy');
  const flagsStorage = await deployments.get('FlagsStorageProxy');

  // set the flags storage address
  const gatewayTokenContract = await ethers.getContractAt('GatewayToken', deployedGatewayToken.address);
  await gatewayTokenContract.updateFlagsStorage(flagsStorage.address);
};

export default func;
func.id = 'set_flags_storage_to_proxy';
func.tags = ['SetFlagsStorage'];
func.dependencies = [];
