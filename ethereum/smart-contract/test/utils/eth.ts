import { Wallet } from 'ethers';

export const randomWallet = () => Wallet.createRandom();

export const randomAddress = () => randomWallet().address;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const NULL_CHARGE = {
  value: 0,
  chargeType: 0,
  token: ZERO_ADDRESS,
  recipient: ZERO_ADDRESS,
  tokenSender: ZERO_ADDRESS,
};
