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
  gatewayToken: "0x1955a7b892C16bc10206Ae14bfa3901D24beB0Db",
  forwarder: "0x3EB6bE85fb313eC5593d1330FbDe87429fd397fb",
  flagsStorage: "0x9372F931633319B28b31e2dE57491097822e4Cf2",
};
