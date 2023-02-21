import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;  
    const { deployer } = await getNamedAccounts();
  
    await deploy("Forwarder", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: true
    });
};

export default func;
func.id = 'deploy_forwarder';
func.tags = ['Forwarder'];
func.dependencies = ['deployer-check'];