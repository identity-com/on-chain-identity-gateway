import { Provider, Signer } from "ethers";

export const isProvider = (
  providerOrSigner: Provider | Signer
): providerOrSigner is Provider => !("provider" in providerOrSigner);

export const asProvider = (providerOrSigner: Provider | Signer): Provider =>
  isProvider(providerOrSigner) ? providerOrSigner : providerOrSigner.provider;
