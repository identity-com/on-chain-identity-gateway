import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {getAccounts} from "../scripts/util";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const gatekeeperNetwork = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers } = hre;
    const { deployer, authority, gatekeeper } = await getAccounts(hre);

    console.log('deployer', deployer);
    console.log('authority', authority);
    console.log('gatekeeper', gatekeeper);

    const gatewayToken = await deployments.get('GatewayToken');

    const token = await ethers.getContractAt("GatewayToken", gatewayToken.address);

    // check if superadmin
    const isSuperAdmin = await token.isSuperAdmin(deployer);
    console.log("deployer ", deployer, "isSuperAdmin", isSuperAdmin);

    const createNetworkTx = await (await token.createNetwork(gatekeeperNetwork, 'Test Gatekeeper Network', false, NULL_ADDRESS, {from: deployer})).wait();
    console.log("created network " + gatekeeperNetwork + " on Gateway Token at " + gatewayToken.address + " using " + createNetworkTx.gasUsed.toNumber() + " gas");

    const addNetworkAuthorityTx = await (await token.addNetworkAuthority(authority, gatekeeperNetwork, {from: deployer})).wait();
    console.log("added new network authority with " + authority + " into Gateway Token at " + gatewayToken.address + " using " + addNetworkAuthorityTx.gasUsed.toNumber() + " gas");
  
    const addGatekeeperTx = await (await token.addGatekeeper(gatekeeper, gatekeeperNetwork, {from: deployer})).wait();
    console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatewayToken.address + " using " + addGatekeeperTx.gasUsed.toNumber() + " gas");
};

export default func;
func.id = 'create_test_gatekeeper_network';
func.tags = ['TestGatekeeperNetwork'];
func.dependencies = ['deploy_gateway_token'];