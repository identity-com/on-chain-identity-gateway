import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployProxyCreate2 } from '../scripts/util';
import { IChargeHandler__factory } from '../typechain-types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  await deployProxyCreate2(hre, 'ChargeHandler', [deployer],
      IChargeHandler__factory.connect
  );
};

export default func;
func.id = 'deploy_charge_handler';
func.tags = ['ChargeHandler'];
