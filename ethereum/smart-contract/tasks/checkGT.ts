import {HardhatRuntimeEnvironment} from "hardhat/types";
const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");

export const checkGT = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  
  const [owner] = await hre.ethers.getSigners();
  const account = ethers.utils.getAddress(args.address);

  const gatewayTokenAddress = "0x9e52f492fE73a94dBaF51E30Ded2b125caD84859";
  const token = new ethers.Contract(gatewayTokenAddress, abi, owner);
  
  const result = await token.balanceOf(account)
  
  console.log({result});
}