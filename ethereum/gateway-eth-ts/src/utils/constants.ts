import { BigNumber } from "ethers";
export const DEFAULT_FLAGS_STORAGE =
  "0xd1895ce312dD4bACbb6bF7226222C237ad5a3767";
export const DEFAULT_GATEWAY_TOKEN_ADDRESS =
  "0x7aa0c390b25327776BF3B281dBB0a9642f6D7f20";
export const DEFAULT_FORWARDER_ADDRESS =
  "0xa2C410cc10B4aDA3a1311435715e514bDBeD7D7C";

export const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
export const DEFAULT_EXPIRATION_BN = BigNumber.from(86_400).mul(
  BigNumber.from(14)
);

export const ZERO_BN = BigNumber.from("0");
export const ONE_BN = BigNumber.from("1");
