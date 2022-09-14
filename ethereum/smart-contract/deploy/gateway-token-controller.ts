import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;  
  const { deployer } = await getNamedAccounts();

  await deploy('GatewayTokenController', {
    from: deployer,
    args: [deployer],
    log: true,
  });
};

export default func;
func.id = 'deploy_gateway_token_controller';
func.tags = ['GatewayTokenController'];
// func.dependencies = ['Forwarder', 'FlagsStorage'];