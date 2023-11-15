import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const removeGatekeeper = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts, deployments } = hre;
  const [deployer] = await ethers.getSigners();

  const gatekeeper = ethers.utils.getAddress(args.gatekeeper);
  const gatekeeperNetwork = args.gatekeepernetwork;

  const gatewayToken = await deployments.get('GatewayTokenProxy');

  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);

  const txReceipt = await contract.connect(deployer).removeGatekeeper(gatekeeper, gatekeeperNetwork);
  const tx = await txReceipt.wait();
  console.log(`removed gatekeeper ${gatekeeper} from network ${gatekeeperNetwork} using ${tx.gasUsed.toNumber()} gas`);
};
