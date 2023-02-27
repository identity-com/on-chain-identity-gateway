import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {deployProxyCreate2} from "../scripts/util";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts} = hre;
    const { deployer } = await getNamedAccounts();

    const forwarder = await deployments.get('Forwarder');
    const flagsStorage = await deployments.get('FlagsStorage');

    const args = ["Gateway Protocol", "PASS", deployer, flagsStorage.address, [forwarder.address]]
    const gatewayTokenContract = await deployProxyCreate2(hre, 'GatewayToken', args);

    const gatewayTokenAddress = gatewayTokenContract.address;
    console.log("deployed GatewayToken at " + gatewayTokenAddress);
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['flags-storage', 'forwarder', 'deployer-check'];