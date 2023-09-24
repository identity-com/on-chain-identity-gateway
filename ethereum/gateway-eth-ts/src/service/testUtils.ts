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
  gatewayToken: "0xC7789bCfaD38b0b07a42f963aD91C0B9125A8328",
  forwarder: "0x98C285DA7be2cdcc4422078939BdF705c502369b",
  flagsStorage: "0x568172E51E85181e658F9ACa4C06B73b3Fc10E56",
  chargeHandler: "0xc34E5E6c71090EeB33A7282794a75E1D7F212D08",
};
