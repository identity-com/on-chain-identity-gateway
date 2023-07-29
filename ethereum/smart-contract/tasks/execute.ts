import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {BigNumber} from "ethers";

export const execute = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers, getNamedAccounts } = hre;

  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY env variable is not set');

  const tx = args.tx;
  const to = args.to;
  const value = BigNumber.from(args.value);

  const [owner] = await ethers.getSigners();
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, owner.provider)

  // const feeData = await signer.getFeeData();

  const txToSend = {
    from: signer.address,
    to,
    data: tx,
    value,
    // use this if you want to manually configure the gas limit
    // gasLimit: 330000,
    // use these values for polygon
    // maxFeePerGas: feeData.maxFeePerGas || undefined,
    // maxPriorityFeePerGas: 30_000_000_000,
  };
  console.log('sending transaction', txToSend)
  const transactionReceipt = await signer.sendTransaction(txToSend);

  console.log('sent transaction', transactionReceipt);

  await transactionReceipt.wait();
};
