import {HardhatRuntimeEnvironment} from "hardhat/types";

export const addGatekeeper = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  
  const gatekeeper = ethers.utils.getAddress(args.gatekeeper);
  const gatekeeperNetwork = ethers.utils.getAddress(args.gatekeepernetwork);

  const token = await ethers.getContractAt(
    'GatewayToken',
    gatekeeperNetwork,
  );

  const txReceipt = await token.estimateGas.addGatekeeper(gatekeeper, {gasPrice: 1000000, gasLimit: 1000000});
  console.log("txReceipt", txReceipt);
  // const tx = await txReceipt.wait();
  // console.log("added new gatekeeper with " + gatekeeper + " address into Gateway Token at " + gatekeeperNetwork + " using " + tx.gasUsed.toNumber() + " gas");
}