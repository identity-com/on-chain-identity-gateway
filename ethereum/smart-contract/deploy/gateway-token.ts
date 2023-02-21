import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployProxy, deployProxyCreate2} from "../scripts/util";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, upgrades } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const forwarder = await deployments.get('Forwarder');
    const flagsStorage = await deployments.get('FlagsStorage');

    const args = ["Gateway Protocol", "PASS", deployer, flagsStorage.address, [forwarder.address]]
    // const gatewayTokenContract = await deployProxy(hre, 'GatewayToken', args);
    const gatewayTokenContract = await deployProxyCreate2(hre, 'GatewayToken', args);

    const gatewayTokenAddress = gatewayTokenContract.address;
    console.log("deployed GatewayToken at " + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['flags-storage', 'forwarder', 'deployer-check'];