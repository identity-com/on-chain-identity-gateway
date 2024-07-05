import {Wallet, Provider, HDNodeWallet, Mnemonic, Signer, NonceManager} from "ethers";

export const DEFAULT_MNEMONIC =
  "test test test test test test test test test test test junk";

const walletFromPath = (path: string) =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(DEFAULT_MNEMONIC), path);

// During testing, the 0th index is the deployer key, the 2nd index is used as the gatekeeper key
// See hardhat.config.ts
export const deployerWallet = (provider: Provider): Signer =>
  walletFromPath("m/44'/60'/0'/0/0").connect(provider);

export const gatekeeperWallet = (provider: Provider): Signer =>
  new NonceManager(walletFromPath("m/44'/60'/0'/0/2").connect(provider));

// matches the bootstrapped network in gateway-token
export const gatekeeperNetwork = 1n;

// These addresses are the ones that hardhat deploys to in the local test environment
// Note, they differ from the default create2 addresses used in production
export const TEST_GATEWAY_TOKEN_ADDRESS = {
  gatewayToken: "0xF6426840b145c4F2246BCbd46AcB79BFd4db4B4b",
  forwarder: "0xa1dCfE59F75e36D2AdAE089933fb38F1507d2862",
  flagsStorage: "0x21814C06043030F47F6bDAea4B85df99029F23d0",
  chargeHandler: "0xD7DdC8D70e7F693f026c87ff0b086C37B92240a6",
};
