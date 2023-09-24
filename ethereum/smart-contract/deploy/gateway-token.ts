import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  const flagsStorage = await deployments.get('FlagsStorageProxy');
  const chargeHandler = await deployments.get('ChargeHandlerProxy');

  const args = ['Gateway Protocol', 'PASS', deployer, flagsStorage.address, chargeHandler.address, []];
  const gatewayTokenContract = await deployProxyCreate2(hre, 'GatewayToken', args);

  const gatewayTokenAddress = gatewayTokenContract.address;
  console.log('deployed GatewayToken at ' + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['FlagsStorage', 'ChargeHandler'];
