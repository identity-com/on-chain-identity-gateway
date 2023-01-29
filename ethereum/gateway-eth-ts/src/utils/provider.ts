import { Provider } from "@ethersproject/providers";
import { Wallet } from "ethers";

export const isProvider = (
  providerOrWallet: Provider | Wallet
): providerOrWallet is Provider => !("_signTypedData" in providerOrWallet);

export const asProvider = (providerOrWallet: Provider | Wallet): Provider =>
  isProvider(providerOrWallet) ? providerOrWallet : providerOrWallet.provider;
