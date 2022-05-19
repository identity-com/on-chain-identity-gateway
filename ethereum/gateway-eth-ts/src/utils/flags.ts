/* eslint-disable @typescript-eslint/require-await */

import { Flags } from "@oclif/core";
import { BigNumber, utils } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

import {
  DEFAULT_GATEWAY_TOKEN,
  DEFAULT_GATEWAY_TOKEN_CONTROLLER,
  DEFAULT_MNEMONIC,
} from "./constants";
import { getProvider } from "./providers";
import { estimateGasPrice, GasPriceKey } from "./gas";

export const privateKeyFlag = Flags.build<string>({
  char: "p",
  env: "PRIVATE_KEY",
  parse: async (input: string) => input,
  default: async () => DEFAULT_MNEMONIC,
  description: "The ethereum address private key for signing messages",
});

export const gatewayTokenAddressFlag = Flags.build<string>({
  char: "t",
  env: "GATEWAY_TOKEN",
  parse: async (input: string) => (utils.isAddress(input) ? input : null),
  default: async () => DEFAULT_GATEWAY_TOKEN,
  description: "GatewayToken address to target",
});

export const gatewayTokenControllerFlag = Flags.build<string>({
  char: "c",
  env: "GATEWAY_TOKEN_CONTROLLER",
  hidden: true,
  parse: async (input: string) => (utils.isAddress(input) ? input : null),
  default: async () => DEFAULT_GATEWAY_TOKEN_CONTROLLER,
  description: "GatewayTokenController address to target",
});

export const networkFlag = Flags.build<BaseProvider>({
  char: "n",
  env: "GTS_DEFAULT_NETWORK",
  parse: async (input: string) => getProvider(input),
  default: async () => getProvider(),
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
  default: 0,
  description: "The amount of blocks to wait mined transaction",
});

export const forwardTransactionFlag = Flags.boolean<boolean>({
  required: false,
  parse: async (input: boolean) => input,
  default: false,
  allowNo: true,
  description: "Whether the transaction will be sent via the Forwarder contract",
})

export const generateTokenIdFlag = Flags.boolean<boolean>({
  char: "g",
  required: false,
  parse: async (input: boolean) => input,
  default: true,
  allowNo: true,
  description:
    "Identifier used to determine wether tokenId has to be generated",
  exclusive: ["tokenIdFlag"],
});

export const bitmaskFlag = Flags.build<BigNumber>({
  char: "b",
  name: "Bitmask",
  required: false,
  parse: async (input: string) => BigNumber.from(input),
  default: BigNumber.from("0"),
  description: "Bitmask constrains to link with newly minting tokenID",
  // dependsOn: ['generateTokenIdFlag'],
  exclusive: ["tokenIdFlag"],
});

export const tokenIdFlag = Flags.build<BigNumber>({
  char: "i",
  name: "tokenID",
  required: false,
  description: "Token ID number to issue",
  parse: async (input: string) => BigNumber.from(input),
  default: null,
  exclusive: ["generateTokenIdFlag", "bitmaskFlag"],
});
