/* eslint-disable @typescript-eslint/require-await */

import { Flags } from "@oclif/core";
import { BigNumber, utils } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

import { estimateGasPrice, GasPriceKey } from "./gas";
import {getProvider} from "./providers";

export const privateKeyFlag = Flags.build<string>({
  char: "p",
  env: "PRIVATE_KEY",
  parse: async (input: string) => input,
  description: "The ethereum address private key for signing messages",
});

export const gatewayTokenAddressFlag = Flags.build<string>({
  char: "t",
  env: "GATEWAY_TOKEN",
  required: true,
  parse: async (input: string) => (utils.isAddress(input) ? input : null),
  description: "GatewayToken address to target",
});

export const networkFlag = Flags.build<BaseProvider>({
  char: "n",
  env: "GTS_DEFAULT_NETWORK",
  parse: async (input: string) => getProvider(input),
  default: async () => getProvider("mainnet"),
  options: ["mainnet", "rinkeby", "ropsten", "kovan", "goerli", "localhost"],
  description: "Specify target network to work with",
});

export const gasPriceFeeFlag = Flags.build<number | BigNumber>({
  char: "f",
  parse: async (input: GasPriceKey) => estimateGasPrice(input),
  default: async () => estimateGasPrice("fast"),
  description:
    "Gas Price level to execute transaction with. For example: instant, fast, standard, slow",
});

export const confirmationsFlag = Flags.build<number>({
  char: "c",
  parse: async (input: string) => Number(input),
  description: "The amount of blocks to wait for mined transaction",
  default: async () => 1,
});

export const bitmaskFlag = Flags.build<BigNumber>({
  char: "b",
  name: "Bitmask",
  required: false,
  parse: async (input: string) => BigNumber.from(input),
  default: BigNumber.from("0"),
  description: "Bitmask constraints to link with newly minting tokenID",
  exclusive: ["tokenIdFlag"],
});

export const tokenIdFlag = Flags.build<BigNumber>({
  char: "i",
  name: "tokenID",
  required: false,
  description: "Token ID number to issue",
  parse: async (input: string) => BigNumber.from(input),
  default: null,
  exclusive: ["bitmaskFlag"],
});
