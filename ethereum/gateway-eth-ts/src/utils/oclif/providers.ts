import {
  BaseProvider,
  JsonRpcProvider,
  getDefaultProvider, InfuraProvider,
} from "@ethersproject/providers";

export const getLocalhostProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider();
};

export const getProvider = function (
  network: string
): BaseProvider {
  if (network === "localhost" || network === "hardhat") return getLocalhostProvider();
  
  if (process.env.INFURA_API_KEY) return new InfuraProvider(network, process.env.INFURA_API_KEY);
  
  return getDefaultProvider(network);
};
