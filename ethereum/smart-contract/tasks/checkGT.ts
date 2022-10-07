import {HardhatRuntimeEnvironment} from "hardhat/types";

export const checkGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  
  const [owner] = await hre.ethers.getSigners();
  const account = ethers.utils.getAddress(args.address);

  const gatewayTokenAddress = args.gatekeepernetwork;
  const token = await ethers.getContractAt(
    'GatewayToken',
    gatewayTokenAddress,
  );

  const result = await token.balanceOf(account)
  
  console.log({result});
}