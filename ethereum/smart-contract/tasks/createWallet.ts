import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const createWallet = async (args: any, { ethers }: HardhatRuntimeEnvironment) => {
  const wallet = ethers.Wallet.createRandom();
  console.log('Private Key: ', wallet.privateKey);
  console.log('Address: ', wallet.address);
};
