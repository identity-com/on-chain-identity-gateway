import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const checkGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, deployments } = hre;

  const account = ethers.utils.getAddress(args.address);

  const gatewayToken = await deployments.get('GatewayToken');
  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);

  const result = await contract['verifyToken(address,uint256)'](account, args.gatekeepernetwork);

  const result2 = await contract['getTokenIdsByOwnerAndNetwork(address,uint256)'](account, args.gatekeepernetwork);

  console.log({ result, result2 });
};
