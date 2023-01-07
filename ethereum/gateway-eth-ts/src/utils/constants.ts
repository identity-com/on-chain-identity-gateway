import { BigNumber } from "@ethersproject/bignumber";
export const DEFAULT_FLAGS_STORAGE =
  "0xB0D4b6A17E71F19f198859Ff6f04a9883bad2E01";
export const DEFAULT_GATEWAY_TOKEN_ADDRESS =
  "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const DEFAULT_FORWARDER_ADDRESS =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export const DEFAULT_EXPIRATION_BN = BigNumber.from(86_400).mul(
  BigNumber.from(14)
);

export const ZERO_BN = BigNumber.from("0");
export const ONE_BN = BigNumber.from("1");
