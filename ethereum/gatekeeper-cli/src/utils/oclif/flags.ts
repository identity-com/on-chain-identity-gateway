import {Flags} from '@oclif/core'
import {BaseProvider, Provider} from '@ethersproject/providers'

import {estimateGasPrice, GasPriceKey} from './gas'
import {getProvider} from './providers'
import {isAddress} from '@ethersproject/address'
import {DEFAULT_GATEWAY_TOKEN_ADDRESS} from '@identity.com/gateway-eth-ts'
import {GetTxGasParamsRes} from 'gas-price-oracle'

export const privateKeyFlag = Flags.custom<string>({
  char: 'p',
  env: 'PRIVATE_KEY',
  parse: async (input: string) => input,
  description: 'The ethereum address private key for signing messages',
})

export const gatewayTokenAddressFlag = Flags.custom<string>({
  char: 't',
  env: 'GATEWAY_TOKEN',
  parse: async (input: string) => {
    if (!isAddress(input)) throw new Error('Invalid Gateway Token address')
    return input
  },
  default: DEFAULT_GATEWAY_TOKEN_ADDRESS,
  description: 'GatewayToken address to target',
})

export const networkFlag = Flags.custom<BaseProvider>({
  char: 'c',  // matches "cluster" in solana-gatekeeper-cli
  env: 'GTS_DEFAULT_NETWORK',
  parse: async (input: string) => getProvider(input),
  default: async () => getProvider('mainnet'),
  options: ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'localhost'],
  description: 'Specify target network to work with',
})

export const gatekeeperNetworkFlag = Flags.custom<bigint>({
  char: 'n',
  parse: async (input: string) => BigInt(input),
  default: 1n,
  description:
      'Gatekeeper network. Defaults to 1',
})

export const feesFlag = Flags.custom<GetTxGasParamsRes>({
  char: 'f',
  parse: async (input: string) => estimateGasPrice(input as GasPriceKey),
  default: () => estimateGasPrice('fast'),
  description:
    'Gas Price level to execute transaction with. For example: instant, fast, standard, slow',
})

export const confirmationsFlag = Flags.custom<number>({
  char: 'b',
  parse: async (input: string) => Number(input),
  description: 'The amount of blocks to wait for mined transaction',
  default: async () => 1,
})

export const bitmaskFlag = Flags.custom<bigint>({
  char: 'b',
  name: 'Bitmask',
  required: false,
  parse: async (input: string) => BigInt(input),
  default: 0n,
  description: 'Bitmask constraints to link with newly minting token',
  exclusive: ['tokenIdFlag'],
})

type Flags = {
  network: Provider | undefined
  gatewayTokenAddress: string | undefined
  gatekeeperNetwork: bigint | undefined
  fees?: GetTxGasParamsRes | undefined
};
export const parseFlags = (flags: Flags) => {
  // These all have defaults and can therefore be safely cast
  const provider = flags.network as Provider
  const gatewayTokenAddress = flags.gatewayTokenAddress as string
  const gatekeeperNetwork = flags.gatekeeperNetwork as bigint

  return {
    provider,
    gatewayTokenAddress,
    gatekeeperNetwork,
    fees: flags.fees,
  }
}

export const parseFlagsWithPrivateKey = (flags: Flags & {privateKey: string | undefined }) => {
  const privateKey = flags.privateKey as string
  return {
    ...parseFlags(flags),
    privateKey,
  }
}
