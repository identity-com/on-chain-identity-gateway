import {
  BaseProvider,
  JsonRpcProvider,
  getDefaultProvider,
} from "@ethersproject/providers";

export const getLocalhostProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider();
};

export const getProvider = function (
  network: string
): BaseProvider {
  const provider: BaseProvider =
    network === "localhost" || network === "hardhat"
      ? getLocalhostProvider()
      : getDefaultProvider(network);

  return provider;
};
