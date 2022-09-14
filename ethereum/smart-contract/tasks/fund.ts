import {HardhatRuntimeEnvironment} from "hardhat/types";
import {BigNumber, BytesLike, utils, Wallet} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export const fund = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const {ethers} = hre;

  const amount = ethers.utils.parseEther(args.amount);
  const account = ethers.utils.getAddress(args.address);

  console.log(`funding ${args.address} with ${amount}`)
  const [owner] = await hre.ethers.getSigners();

  const network = await owner.provider?.getNetwork()
  console.log(network)

  const balance = await owner.getBalance();
  console.log(balance);

  const transactionReceipt = await owner.sendTransaction({
    to: account,
    value: amount
  });

  console.log(transactionReceipt);
  
  await transactionReceipt.wait();
}