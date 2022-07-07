import {Wallet} from "ethers";
import {Provider} from "@ethersproject/providers";

// Deployed by Hardhat on localnet
export const DEFAULT_GATEWAY_TOKEN_ADDRESS = "0x29E9c49487246687B484c04CE24e8bF4DC1A8D4B";
export const DEFAULT_FORWARDER_ADDRESS = "0x8E80e54894Efb82367B73E7eb01522a89D87F2cE";

export const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

// During testing, the 0th index is the deployer key, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const deployerWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/0").connect(provider);
export const gatekeeperWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/2").connect(provider);
