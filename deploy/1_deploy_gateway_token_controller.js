module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()
  
  const { address } = await deploy("GatewayTokenController", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false
  })

  const tokenController = await ethers.getContract("GatewayTokenController")
  let gatewayToken = await (await tokenController.createGatekeeperNetwork("Test-KYC", "tKYC", false, "0x0000000000000000000000000000000000000000", {from: deployer})).wait()

  console.log("deployed tKYC GatewayToken at " + gatewayToken.events[gatewayToken.events.length - 1].args.tokenAddress + " with " + gatewayToken.gasUsed.toNumber() + " gas");
}

module.exports.tags = ["GatewayTokenController"]
module.exports.dependencies = ["GatewayToken"]