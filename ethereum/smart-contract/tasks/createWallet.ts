import {HardhatRuntimeEnvironment} from "hardhat/types";
import {HardhatNetworkHDAccountsConfig} from "hardhat/src/types/config";

export const createWallet = async (args: any, { ethers }: HardhatRuntimeEnvironment) => {
  const wallet = ethers.Wallet.createRandom();
  console.log("Private Key: ", wallet.privateKey);
  console.log("Address: ", wallet.address)
}