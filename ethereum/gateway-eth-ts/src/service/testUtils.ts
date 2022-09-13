import {Wallet} from "ethers";
import {Provider} from "@ethersproject/providers";

// Deployed by Hardhat on localnet
export const DEFAULT_GATEWAY_TOKEN_ADDRESS = "0x80226BC342Ca42ACF258D88F99Edbac647e88F84";
export const DEFAULT_FORWARDER_ADDRESS = "0x2F1A34f0fbf164E229D4c83382b88533aFb881be";

export const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

// During testing, the 0th index is the deployer key, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const deployerWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/0").connect(provider);
export const gatekeeperWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/2").connect(provider);
