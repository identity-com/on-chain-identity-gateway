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

  const transactionReceipt = await signer.sendTransaction({
    from: signer.address,
    to,
    data: tx,
    value
  });

  console.log('sent transaction', transactionReceipt);

  await transactionReceipt.wait();
};
