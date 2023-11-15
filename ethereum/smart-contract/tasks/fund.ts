import { HardhatRuntimeEnvironment } from 'hardhat/types';

export const fund = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;

  const amount = ethers.utils.parseEther(args.amount);

  const accounts = await hre.getNamedAccounts();
  const from = await hre.ethers.getSigner(accounts[args.from]);
  const network = await from.provider?.getNetwork();
  const balance = await from.getBalance();

  const recipient = accounts[args.to] ?? args.to;

  console.log(
    `Funding ${recipient} with ${amount} from ${args.from} (${from.address}). Network ${
      network?.chainId
    }, balance ${balance}`,
  );

  if (args.dryrun) return;

  const transactionResponse = await from.sendTransaction({
    to: recipient,
    value: amount,
  });

  const transactionReceipt = await transactionResponse.wait();

  console.log(`Transaction receipt: ${JSON.stringify(transactionReceipt, null, 2)}`);
};
