import { BigNumber } from "@ethersproject/bignumber";
export const DEFAULT_FLAGS_STORAGE =
  "0xd1895ce312dD4bACbb6bF7226222C237ad5a3767";
export const DEFAULT_GATEWAY_TOKEN_ADDRESS =
  "0x4B731a08Eb7a42cAFb9835452a73e35359332f19";
export const DEFAULT_FORWARDER_ADDRESS =
  "0xa2C410cc10B4aDA3a1311435715e514bDBeD7D7C";

export const DEFAULT_EXPIRATION_BN = BigNumber.from(86_400).mul(
  BigNumber.from(14)
);

export const ZERO_BN = BigNumber.from("0");
export const ONE_BN = BigNumber.from("1");
