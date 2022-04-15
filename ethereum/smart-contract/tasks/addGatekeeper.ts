import {HardhatRuntimeEnvironment} from "hardhat/types";
const { abi } = require("../build/contracts/GatewayToken.sol/GatewayToken.json");

export const addGatekeeper = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  
  const [owner] = await hre.ethers.getSigners();
  const gatekeeper = ethers.utils.getAddress(args.gatekeeper);
  const gatekeeperNetwork = ethers.utils.getAddress(args.gatekeepernetwork);

  const token = new ethers.Contract(gatekeeperNetwork, abi, owner);
  const txReceipt = await token.estimateGas.addGatekeeper(gatekeeper, {gasPrice: 1000000, gasLimit: 1000000});
  console.log("txReceipt", txReceipt);
  // const tx = await txReceipt.wait();
  // console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatekeeperNetwork + " using " + tx.gasUsed.toNumber() + " gas");
}