import { Wallet } from "ethers";
import { Provider } from "@ethersproject/providers";

export const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

// During testing, the 0th index is the deployer key, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const deployerWallet = (provider: Provider) =>
  Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/0").connect(provider);
export const gatekeeperWallet = (provider: Provider) =>
  Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/2").connect(provider);

// matches the bootstrapped network in gateway-token
export const gatekeeperNetwork = 1n;

// These addresses are the ones that hardhat deploys to in the local test environment
// Note, they differ from the default create2 addresses used in production
export const TEST_GATEWAY_TOKEN_ADDRESS = {
  gatewayToken: "0x9491113626f4CfA1D9AFAb10293E6f98dBa86fe1",
  forwarder: "0x7d648a11AE84487526b7474b6A2BC0BE3a299BBb",
  flagsStorage: "0x4b94c68e6D5b39De743742D50D4785eedf688445",
};
