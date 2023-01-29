import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const forwarder = await deployments.get('Forwarder');
    const flagsStorage = await deployments.get('FlagsStorage');

    const result = await deploy("GatewayToken", {
        from: deployer,
        args: ["Gateway Protocol", "PASS", flagsStorage.address, [forwarder.address]],
        log: true,
        deterministicDeployment: true
    });
    const gatewayTokenAddress = result.address;
    console.log("deployed GatewayToken at " + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['flags-storage', 'forwarder'];