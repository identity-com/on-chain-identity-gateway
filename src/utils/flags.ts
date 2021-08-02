import { flags } from "@oclif/command";
import { utils, Wallet } from "ethers";
import { BaseProvider } from '@ethersproject/providers';

import { DEFAULT_GATEWAY_TOKEN, DEFAULT_GATEWAY_TOKEN_CONTROLLER, DEFAULT_MNEMONIC } from "./constants";
import { getProvider, getLocalhostProvider } from "./providers";
import { privateKeySigner, mnemonicSigner } from "./signer";
import { estimateGasPrice, GasPriceKey } from "./gas";

export const privateKeyFlag = flags.build<Wallet>({
  char: "p",
  env: "PRIVATE_KEY",
  parse: privateKeySigner,
  default: () => mnemonicSigner(DEFAULT_MNEMONIC),
  description: "The ethereum address private key for signing messages",
});

export const gatewayTokenAddressFlag = flags.build<string>({
  char: "t",
  env: "GATEWAY_TOKEN",
  parse: (input: string) => utils.isAddress(input) ? input : null,
  default: () => DEFAULT_GATEWAY_TOKEN,
  description: "GatewayToken address to target",
});

export const gatewayTokenControllerFlag = flags.build<string>({
  char: "c",
  env: "GATEWAY_TOKEN_CONTROLLER",
  parse: (input: string) => utils.isAddress(input) ? input : null,
  default: () => DEFAULT_GATEWAY_TOKEN_CONTROLLER,
  description:
    "GatewayTokenController address to target",
});

export const networkFlag = flags.build<BaseProvider>({
  char: "n",
  env: "GTS_DEFAULT_NETWORK",
  parse: (input: string) => getProvider(input),
  default: () => getProvider(),
  description: "Specify target network to work with",
});

export const gasPriceFlag = flags.build<Promise<number>>({
  char: "g",
    parse: (input: GasPriceKey) => estimateGasPrice(input),
    default: () => estimateGasPrice('fast'),
    description:
      "Gas Price level to execute transaction with. For example: instant, fast, standard, slow",
});
