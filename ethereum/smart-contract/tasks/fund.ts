import {HardhatRuntimeEnvironment} from "hardhat/types";

export const fund = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const {ethers} = hre;

  const amount = ethers.utils.parseEther(args.amount);

  const accounts = await hre.getNamedAccounts();
  const from = await hre.ethers.getSigner(accounts[args.from]);
  const network = await from.provider?.getNetwork()
  const balance = await from.getBalance();

  console.log(`Funding ${args.to} (${accounts[args.to]}) with ${amount} from ${args.from} (${from.address}). Network ${network?.chainId}, balance ${balance}`);

  if (args.dryrun) return;

  const transactionResponse = await from.sendTransaction({
    to: accounts[args.to],
    value: amount
  });

  const transactionReceipt = await transactionResponse.wait();

  console.log(`Transaction receipt: ${JSON.stringify(transactionReceipt, null, 2)}`);
}