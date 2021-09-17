const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");
const {toBytes32} = require('../test/utils').strings;

module.exports = async function ({ ethers, deployments, getNamedAccounts, getUnnamedAccounts }) {
  const { deploy } = deployments
  
  const { deployer } = await getNamedAccounts()
  const signer = await ethers.getSigner(deployer);
  
  let authorityAddr = "0x9b4525aefEDA97b78559012ddA8163eF90B3dF21";
  let hexRetailFlag = toBytes32("Retail");
  let hexInstitutionFlag = toBytes32("Institution");
  let hexAccreditedInvestorFlag = toBytes32("AccreditedInvestor");

  const { address } = await deploy("FlagsStorage", {
    from: deployer,
    args: [deployer],
    log: true,
    deterministicDeployment: false
  });

  await deploy("GatewayTokenController", {
    from: deployer,
    args: [address],
    log: true,
    deterministicDeployment: false
  });

  const flagsStorage = await ethers.getContract("FlagsStorage");
  const tokenController = await ethers.getContract("GatewayTokenController");
  const trustedForwarder = await ethers.getContract("Forwarder");

  let flagCodes = [hexRetailFlag, hexInstitutionFlag, hexAccreditedInvestorFlag];
  let indexArray = [0, 1, 2];

  let tx = await (await flagsStorage.addFlags(flagCodes, indexArray, {from: deployer})).wait();
  console.log("Added " + tx.events.length +  " flags into FlagsStorage with " + tx.gasUsed.toNumber() + " gas");

  let gatewayToken = await (await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", trustedForwarder.address, {from: deployer})).wait()

  let gatewayTokenAddress = gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress;
  console.log("deployed tKYC GatewayToken at " + gatewayTokenAddress + " with " + gatewayToken.gasUsed.toNumber() + " gas");

  let token = new ethers.Contract(gatewayTokenAddress, abi, signer);

  tx = await (await token.addNetworkAuthority(authorityAddr, {from: deployer})).wait();
  console.log("added new network authority with " + authorityAddr + " into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");

  tx = await (await token.addGatekeeper(authorityAddr, {from: deployer})).wait();
  console.log("added new gatekeeper with " + authorityAddr + " address into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");
}

module.exports.tags = ["GatewayTokenController", "FlagsStorage"]
module.exports.dependencies = ["GatewayToken, Forwarder"]