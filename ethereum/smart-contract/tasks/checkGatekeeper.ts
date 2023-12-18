import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const checkGatekeeper = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments } = hre;

  const gatekeeper = ethers.utils.getAddress(args.gatekeeper);
  const gatekeeperNetwork = args.gatekeepernetwork;

  const gatewayToken = await deployments.get('GatewayTokenProxy');

  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);

  const alreadyAdded = await contract.isGatekeeper(gatekeeper, gatekeeperNetwork);
  console.log(`gatekeeper ${gatekeeper} already in network ${gatekeeperNetwork}? ${alreadyAdded}`)
};
