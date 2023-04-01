import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {getAccounts} from "../scripts/util";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const gatekeeperNetwork = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;

  // WARNING! If any of the below keys are the same as each other
  // hardhat does not resolve them properly. Check by deploying to localhost that they are correct first
  // yarn local --no-deploy &
  // yarn deploy localhost
  let { deployer, authority, gatekeeper } = await getAccounts(hre);
  // hack for the deduping keys bug- set the gatekeeper auth to the authority
  if (process.env.STAGE === 'prod') gatekeeper = authority;

    const deployerSigner = await ethers.getSigner(deployer);
    const authoritySigner = await ethers.getSigner(authority);

    console.log('deployer', deployer);
    console.log('authority', authority);
    console.log('gatekeeper', gatekeeper);

    const gatewayToken = await deployments.get('GatewayTokenProxy');

    const token = (await ethers.getContractAt("GatewayToken", gatewayToken.address)).connect(deployerSigner);

    // check if superadmin
    const isSuperAdmin = await token.isSuperAdmin(deployer);
    console.log("deployer ", deployer, "isSuperAdmin", isSuperAdmin);

    // add the flexible nonce forwarder
    const flexibleNonceForwarder = await deployments.get('FlexibleNonceForwarder');
    const addForwarderTx = await (await token.addForwarder(flexibleNonceForwarder.address, {from: deployer})).wait();
    console.log("Added flexible nonce forwarder " + flexibleNonceForwarder.address + " on Gateway Token at " + gatewayToken.address + " using " + addForwarderTx.gasUsed.toNumber() + " gas");

    if (await token.getNetwork(gatekeeperNetwork)) {
        console.log("network " + gatekeeperNetwork + " already exists");
    } else {
        const createNetworkTx = await (await token.createNetwork(gatekeeperNetwork, 'tgnuXXNMDLK8dy7Xm1TdeGyc95MDym4bvAQCwcW21Bf', false, NULL_ADDRESS, {from: deployer})).wait();
        console.log("created network " + gatekeeperNetwork + " on Gateway Token at " + gatewayToken.address + " using " + createNetworkTx.gasUsed.toNumber() + " gas");
    }

    const addNetworkAuthorityTx = await (await token.addNetworkAuthority(authority, gatekeeperNetwork)).wait();
    console.log("added new network authority with " + authority + " into Gateway Token at " + gatewayToken.address + " using " + addNetworkAuthorityTx.gasUsed.toNumber() + " gas");
  
    const addGatekeeperTx = await (await token.connect(authoritySigner).addGatekeeper(gatekeeper, gatekeeperNetwork)).wait();
    console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatewayToken.address + " using " + addGatekeeperTx.gasUsed.toNumber() + " gas");
};

export default func;
func.id = 'create_test_gatekeeper_network';
func.tags = ['TestGatekeeperNetwork'];
func.dependencies = ['deploy_gateway_token'];