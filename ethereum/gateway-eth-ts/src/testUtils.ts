import {Wallet} from "ethers";
import {DEFAULT_MNEMONIC} from "./utils/constants";
import {Network, Provider} from "@ethersproject/providers";
import {GatewayTs} from "./GatewayTs";

// During testing, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const gatekeeperWallet = (provider: Provider) => Wallet.fromMnemonic(DEFAULT_MNEMONIC, "m/44'/60'/0'/0/2").connect(provider);

export const issueTestToken = (provider: Provider, network: Network, gatewayTokenAddress: string, recipient: string) => {
  const gatekeeper = gatekeeperWallet(provider);
  
  console.log(`As the gatekeeper ${gatekeeper.address}, issuing a token to ${recipient}`);
  const gatewayLib = new GatewayTs(gatekeeper, network, gatewayTokenAddress);
  return gatewayLib.issue(recipient)
    .then((tx) => tx.send())
    .then((tx) => tx.confirm());
}

export const freezeTestToken = async (provider: Provider, network: Network, gatewayTokenAddress: string, recipient: string) => {
  const gatekeeper = gatekeeperWallet(provider);

  console.log(`As the gatekeeper ${gatekeeper.address}, freezing a token to ${recipient}`);
  const gatewayLib = new GatewayTs(gatekeeper, network, gatewayTokenAddress);
  const tokenId = await gatewayLib.getTokenId(recipient);
  return gatewayLib.freeze(tokenId)
    .then((tx) => tx.send())
    .then((tx) => tx.confirm());
}