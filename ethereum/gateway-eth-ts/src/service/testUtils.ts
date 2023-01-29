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
  gatewayToken: "0x740846db34BD9be3ABeF576873b4063E8b4E50ce",
  forwarder: "0xa2C410cc10B4aDA3a1311435715e514bDBeD7D7C",
  flagsStorage: "0x17963bd7A313BCa22Fb1EDFCF353607d71aB593c",
};
