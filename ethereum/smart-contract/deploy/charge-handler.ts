import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  await deployProxyCreate2(hre, 'ChargeHandler', []);
};

export default func;
func.id = 'deploy_charge_handler';
func.tags = ['ChargeHandler'];
