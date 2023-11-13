import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deployer } = await getNamedAccounts();

  // const flagsStorage = await deployments.get('FlagsStorageProxy');
  // NOTE - this is incorrect, it should be the proxy address, but previous deployments used the direct address
  // which influences the contract address that is generated.
  // We rectify this by setting the correct address in upgrade v2 (TODO)
  const flagsStorage = await deployments.get('FlagsStorage');

  const args = ['Gateway Protocol', 'PASS', deployer, flagsStorage.address, []];
  const gatewayTokenContract = await deployProxyCreate2(hre, 'GatewayToken', args);

  const gatewayTokenAddress = gatewayTokenContract.address;
  console.log('deployed GatewayToken at ' + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token_v0';
func.tags = ['GatewayTokenV0'];
func.dependencies = ['FlagsStorage'];
