import {Flags} from '@oclif/core'
import {BaseProvider, Provider} from '@ethersproject/providers'

import {estimateGasPrice, GasPriceKey} from './gas'
import {getProvider, networks} from './providers'
import {isAddress} from '@ethersproject/address'
import {DEFAULT_GATEWAY_TOKEN_ADDRESS} from '@identity.com/gateway-eth-ts'
import {GetTxGasParamsRes} from 'gas-price-oracle'
import {BigNumber} from '@ethersproject/bignumber'

export const privateKeyFlag = Flags.custom<string>({
  char: 'p',
  name: 'privateKey',
  env: 'PRIVATE_KEY',
  parse: async (input: string) => input,
  description: 'The ethereum address private key for signing messages (or set PRIVATE_KEY environment variable)',
})

export const gatewayTokenAddressFlag = Flags.custom<string>({
  char: 't',
  name: 'gateway-token-address',
  env: 'GATEWAY_TOKEN_ADDRESS',
  parse: async (input: string) => {
    if (!isAddress(input)) throw new Error('Invalid Gateway Token address')
    return input
  },
  default: DEFAULT_GATEWAY_TOKEN_ADDRESS,
  description: 'GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS environment variable)',
})

export const networkFlag = Flags.custom<BaseProvider>({
  char: 'c',  // matches "cluster" in solana-gatekeeper-cli
  env: 'GTS_DEFAULT_NETWORK',
  parse: async (input: string) => getProvider(input),
  default: async () => getProvider('mainnet'),
  options: Object.keys(networks),
  description: 'Specify target network to work with (or set GTS_DEFAULT_NETWORK environment variable)',
})

export const gatekeeperNetworkFlag = Flags.custom<number>({
  char: 'n',
  name: 'gatekeeper-network',
  parse: async (input: string) => Number(input),
  default: 1,
  description:
      'Gatekeeper network. Defaults to 1',
})

export const feesFlag = Flags.custom<GetTxGasParamsRes>({
  char: 'f',
  name: 'fees',
  parse: async (input: string) => estimateGasPrice(input as GasPriceKey),
  description:
    'Gas Price level to execute transaction with. For example: instant, fast, standard, slow',
})

export const confirmationsFlag = Flags.custom<number>({
  char: 'w',
  name: 'confirmations',
  parse: async (input: string) => Number(input),
  description: 'The amount of blocks to wait for mined transaction',
  default: async () => 1,
})

export const bitmaskFlag = Flags.custom<BigNumber>({
  char: 'b',
  name: 'bitmask',
  required: false,
  parse: async (input: string) => BigNumber.from(input),
  default: BigNumber.from(0),
  description: 'Bitmask constraints to link with newly minting token',
})

type Flags = {
  network: Provider | undefined
  gatewayTokenAddress: string | undefined
  gatekeeperNetwork: number | undefined
  fees?: GetTxGasParamsRes | undefined
};
export const parseFlags = (flags: Flags) => {
  // These all have defaults and can therefore be safely cast
  const provider = flags.network as Provider
  const gatewayTokenAddress = flags.gatewayTokenAddress as string
  const gatekeeperNetwork = BigInt(flags.gatekeeperNetwork as number)

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
