import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deployer, authority, gatekeeper } = await getNamedAccounts();
  
    const forwarder = await deployments.get('Forwarder');
    const trustedForwarder = await ethers.getContractAt("Forwarder", forwarder.address);

    const gatewayTokenController = await deployments.get('GatewayTokenController');
    const tokenController = await ethers.getContractAt("GatewayTokenController", gatewayTokenController.address);

    let gatewayToken = await (await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", trustedForwarder.address, {from: deployer})).wait()
    let gatewayTokenAddress = gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress;
    console.log("deployed tKYC GatewayToken at " + gatewayTokenAddress + " with " + gatewayToken.gasUsed.toNumber() + " gas");
  
    let token = await ethers.getContractAt("GatewayToken", gatewayTokenAddress);

    let tx = await (await token.addNetworkAuthority(authority, {from: deployer})).wait();
    console.log("added new network authority with " + authority + " into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");
  
    tx = await (await token.addGatekeeper(gatekeeper, {from: deployer})).wait();
    console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");
};

export default func;
func.id = 'deploy_gateway_token';
func.tags = ['GatewayToken'];
func.dependencies = ['GatewayTokenController'];