import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const gatekeeperNetwork = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer, authority, gatekeeper } = await getNamedAccounts();

    const forwarder = await deployments.get('Forwarder');
    const flagsStorage = await deployments.get('FlagsStorage');

    const result = await deploy("GatewayToken", {
        from: deployer,
        args: ["Gateway Protocol", "PASS", flagsStorage.address, [forwarder.address]],
        log: true,
        deterministicDeployment: false
    });
    const gatewayTokenAddress = result.address;
    console.log("deployed GatewayToken at " + gatewayTokenAddress);
  
    const token = await ethers.getContractAt("GatewayToken", gatewayTokenAddress);

    const createNetworkTx = await (await token.createNetwork(gatekeeperNetwork, 'Test Gatekeeper Network', false, NULL_ADDRESS, {from: deployer})).wait();
    console.log("created network " + gatekeeperNetwork + " on Gateway Token at " + gatewayTokenAddress + " using " + createNetworkTx.gasUsed.toNumber() + " gas");

    const addNetworkAuthorityTx = await (await token.addNetworkAuthority(authority, gatekeeperNetwork, {from: deployer})).wait();
    console.log("added new network authority with " + authority + " into Gateway Token at " + gatewayTokenAddress + " using " + addNetworkAuthorityTx.gasUsed.toNumber() + " gas");
  
    const addGatekeeperTx = await (await token.addGatekeeper(gatekeeper, gatekeeperNetwork, {from: deployer})).wait();
    console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatewayTokenAddress + " using " + addGatekeeperTx.gasUsed.toNumber() + " gas");
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['flags-storage', 'forwarder'];