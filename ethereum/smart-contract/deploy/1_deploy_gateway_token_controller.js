const hardhat = require('hardhat');
const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");
const {toBytes32} = require('../test/utils').strings;

async function main() {
  console.log("Running script 1_deploy_gateway_token_controller.js");
  const { getNamedAccounts, deployments } = hardhat;
  const { deploy } = deployments
  
  const { deployer } = await getNamedAccounts();
  const signer = await ethers.getSigner(deployer);
  
  // Zambezi pass network authority:
  let gkNetworkAuthorityAddr = "0xF32b1CAABFbaEe9173635433BCC9F43eD25d8Afc";
  let gatekeeperAuthorityAddr = "0xcbaA8FDf9A9673850cf75E6E42B4eA1aDaA87688";
  let hexRetailFlag = toBytes32("Retail");
  let hexInstitutionFlag = toBytes32("Institution");
  let hexAccreditedInvestorFlag = toBytes32("AccreditedInvestor");

  
  const { address: flagsStorageAddress } = await deploy("FlagsStorage", {
    from: deployer,
    args: [deployer],
    log: true,
    deterministicDeployment: false
  });

  console.log('Deployed FlagsStorage at address', flagsStorageAddress);

  const { address: controllerAddress} = await deploy("GatewayTokenController", {
    from: deployer,
    args: [flagsStorageAddress],
    log: true,
    deterministicDeployment: false
  });
  console.log('Deployed GatewayTokenController at address', controllerAddress);

  const flagsStorage = await ethers.getContract("FlagsStorage");
  const tokenController = await ethers.getContract("GatewayTokenController");
  const trustedForwarder = await ethers.getContract("Forwarder");

  let flagCodes = [hexRetailFlag, hexInstitutionFlag, hexAccreditedInvestorFlag];
  let indexArray = [0, 1, 2];

  console.log('Adding flags into flag storage...');
  let tx = await (await flagsStorage.addFlags(flagCodes, indexArray, {from: deployer})).wait();
  console.log("Added " + tx.events.length +  " flags into FlagsStorage with " + tx.gasUsed.toNumber() + " gas");

  let gatewayToken = await (await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", trustedForwarder.address, {from: deployer})).wait()

  let gatewayTokenAddress = gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress;
  console.log("deployed tKYC GatewayToken at " + gatewayTokenAddress + " with " + gatewayToken.gasUsed.toNumber() + " gas");

  let token = new ethers.Contract(gatewayTokenAddress, abi, signer);

  tx = await (await token.addNetworkAuthority(gkNetworkAuthorityAddr, {from: deployer})).wait();
  console.log("added new network authority with address" + gkNetworkAuthorityAddr + " into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");

  console.log('Adding gatekeeper to network ', { gatekeeperAuthorityAddr });
  tx = await (await token.addGatekeeper(gatekeeperAuthorityAddr, {from: deployer})).wait();
  console.log("added new gatekeeper with address " + gatekeeperAuthorityAddr + " into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });