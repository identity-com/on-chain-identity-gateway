const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");
  
module.exports = async function ({ ethers, deployments, getNamedAccounts, getUnnamedAccounts }) {
  const { deploy } = deployments
  
  const { deployer } = await getNamedAccounts()
  const signer = await ethers.getSigner(deployer);
  
  const { address } = await deploy("GatewayTokenController", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false
  })

  const tokenController = await ethers.getContract("GatewayTokenController")

  let gatewayToken = await (await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", {from: deployer})).wait()

  let gatewayTokenAddress = gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress;

  console.log("deployed tKYC GatewayToken at " + gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress + " with " + gatewayToken.gasUsed.toNumber() + " gas");

  let token = new ethers.Contract(gatewayTokenAddress, abi, signer);

  let authorityAddr = "0x9b4525aefEDA97b78559012ddA8163eF90B3dF21";

  let tx = await (await token.addNetworkAuthority(authorityAddr, {from: deployer})).wait();
  console.log("added new network authority with " + authorityAddr + " into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");

  tx = await (await token.addGatekeeper(authorityAddr, {from: deployer})).wait();
  console.log("added new gatekeeper with " + authorityAddr + " address into Gateway Token at " + gatewayTokenAddress + " using " + tx.gasUsed.toNumber() + " gas");
}

module.exports.tags = ["GatewayTokenController"]
module.exports.dependencies = ["GatewayToken"]