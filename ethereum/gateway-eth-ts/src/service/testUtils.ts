import {Wallet} from "ethers";
import {Provider} from "@ethersproject/providers";

// Deployed by Hardhat on localnet
export const DEFAULT_GATEWAY_TOKEN_ADDRESS = "0xd8058efe0198ae9dD7D563e1b4938Dcbc86A1F81";
export const DEFAULT_FORWARDER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

// During testing, the 0th index is the deployer key, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const deployerWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/0").connect(provider);
export const gatekeeperWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/2").connect(provider);
