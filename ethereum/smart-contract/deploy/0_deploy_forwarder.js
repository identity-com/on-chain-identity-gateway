const hardhat = require('hardhat');

async function main() {
    console.log("Running script 0_deploy_forwarder.js");
    const { getNamedAccounts, deployments } = hardhat;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log('deployer', deployer);

    const { address } = await deploy("Forwarder", {
          from: deployer,
          args: [],
          log: true,
          deterministicDeployment: false
        });
  
    console.log('Forwarder contract address: ', address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });