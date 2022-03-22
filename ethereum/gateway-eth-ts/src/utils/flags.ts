import { flags } from "@oclif/command";
import { BigNumber, utils } from "ethers";
import { BaseProvider } from '@ethersproject/providers';

import { DEFAULT_GATEWAY_TOKEN, DEFAULT_GATEWAY_TOKEN_CONTROLLER, DEFAULT_MNEMONIC } from "./constants";
import { getProvider } from "./providers";
import { estimateGasPrice, GasPriceKey } from "./gas";

export const privateKeyFlag = flags.build<string>({
  char: "p",
  env: "PRIVATE_KEY",
  parse: (input: string) => input,
  default: () => DEFAULT_MNEMONIC,
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
  hidden: true,
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

export const gasPriceFeeFlag = flags.build<Promise<number | BigNumber>>({
  char: "f",
  parse: (input: GasPriceKey) => estimateGasPrice(input),
  default: () => estimateGasPrice('fast'),
  description:"Gas Price level to execute transaction with. For example: instant, fast, standard, slow",
});

export const confirmationsFlag = flags.build<number>({
  char: "c",
  parse: (input: string) => Number(input),
  default: 0,
  description:"The amount of blocks to wait mined transaction",
});

export const forwardTransactionFlag = flags.boolean<boolean>({
  required: false,
  parse: (input: boolean) => input,
  default: false,
  allowNo: true,
  description: "Whether the transaction will be sent via the Forwarder contract",
})

export const generateTokenIdFlag = flags.boolean<boolean>({
  char: "g",
  required: false,
  parse: (input: boolean) => input,
  default: true,
  allowNo: true,
  description:"Identifier used to determine wether tokenId has to be generated",
  exclusive: ['tokenIdFlag'],
});

export const bitmaskFlag = flags.build<BigNumber>({
  char: "b",
  name: "Bitmask",
  required: false,
  parse: (input: string) => BigNumber.from(input),
  default: BigNumber.from('0'),
  description:"Bitmask constrains to link with newly minting tokenID",
  // dependsOn: ['generateTokenIdFlag'],
  exclusive: ['tokenIdFlag'],
});

export const tokenIdFlag = flags.build<BigNumber>({
  char: "i",
  name: "tokenID",
  required: false,
  description: "Token ID number to issue",
  parse: (input: string) => BigNumber.from(input),
  default: null,
  exclusive: ['generateTokenIdFlag', 'bitmaskFlag'],
})
