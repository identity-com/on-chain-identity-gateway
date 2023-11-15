import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const addGatekeeper = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts, deployments } = hre;
  const [deployer] = await ethers.getSigners();

  const gatekeeper = ethers.utils.getAddress(args.gatekeeper);
  const gatekeeperNetwork = args.gatekeepernetwork;

  const gatewayToken = await deployments.get('GatewayTokenProxy');

  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);

  const alreadyAdded = await contract.isGatekeeper(gatekeeper, gatekeeperNetwork);
  console.log(`gatekeeper ${gatekeeper} already added to network ${gatekeeperNetwork}: ${alreadyAdded}`);
  if (alreadyAdded) return;

  const txReceipt = await contract.connect(deployer).addGatekeeper(gatekeeper, gatekeeperNetwork);
  const tx = await txReceipt.wait();
  console.log(`added new gatekeeper ${gatekeeper} to network ${gatekeeperNetwork} using ${tx.gasUsed.toNumber()} gas`);
};
