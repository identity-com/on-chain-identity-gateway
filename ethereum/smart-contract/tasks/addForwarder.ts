import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const addForwarder = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts, deployments } = hre;

  const { deployer } = await getNamedAccounts();
  console.log('deployer', deployer);

  const gatewayToken = await deployments.get('GatewayToken');

  const contract = await ethers.getContractAt('GatewayToken', gatewayToken.address);
  const transactionReceipt = await contract.connect(deployer).addForwarder(args.forwarder);

  console.log(
    'added new forwarder with ' +
      args.forwarder +
      ' address into Gateway Token at ' +
      gatewayToken.address +
      ' using ' +
      transactionReceipt.gasUsed.toNumber() +
      ' gas',
  );

  await transactionReceipt.wait();
};
