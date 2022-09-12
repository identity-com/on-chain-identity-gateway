import {
  BaseProvider,
  JsonRpcProvider,
  getDefaultProvider,
} from "@ethersproject/providers";
import { DEFAULT_NETWORK } from "./constants";

export const getLocalhostProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider();
};

export const getProvider = function (
  network: string = DEFAULT_NETWORK
): BaseProvider {
  const provider: BaseProvider =
    network === "localhost" || network === "hardhat"
      ? getLocalhostProvider()
      : getDefaultProvider(network);

  return provider;
};
