import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  await deployProxyCreate2(hre, 'ChargeHandler', [deployer]);
};

export default func;
func.id = 'deploy_charge_handler';
func.tags = ['ChargeHandler'];
