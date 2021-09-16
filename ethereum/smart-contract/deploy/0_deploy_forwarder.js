module.exports = async function ({ ethers, deployments, getNamedAccounts, getUnnamedAccounts }) {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()
  
  const { address } = await deploy("Forwarder", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false
  });
  
  console.log("Forwarder: " + address);
}

module.exports.tags = ["Forwarder"]
module.exports.dependencies = []