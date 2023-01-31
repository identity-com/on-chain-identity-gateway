import {
  BaseProvider,
  JsonRpcProvider,
  getDefaultProvider, InfuraProvider, Networkish,
} from '@ethersproject/providers'
import {Network} from '@ethersproject/networks'
import {ConnectionInfo} from '@ethersproject/web'

export const getLocalhostProvider = (): JsonRpcProvider => {
  return new JsonRpcProvider()
}

type ExtendedNetwork = Network & {url: string}

export const networks = {
  localhost: {
    url: 'http://localhost:8545/',
    chainId: 31_337,
  },
  mainnet: {
    url: 'https://mainnet.infura.io/v3/',
    chainId: 1,
  },
  sepolia: {
    url: 'https://sepolia.infura.io/v3/',
    chainId: 11_155_111,
  },
  goerli: {
    url: 'https://goerli.infura.io/v3/',
    chainId: 5,
  },
  polygonMumbai: {
    url: 'https://polygon-mumbai.infura.io/v3/',
    chainId: 80_001,
  },
  polygonMainnet: {
    url: 'https://polygon-mainnet.infura.io/v3/',
    chainId: 137,
  },
  auroraTestnet: {
    url: 'https://aurora-testnet.infura.io/v3/',
    chainId: 1_313_161_555,
  },
  auroraMainnet: {
    url: 'https://aurora-mainnet.infura.io/v3/',
    chainId: 1_313_161_554,
  },
  optimismGoerli: {
    url: 'https://optimism-goerli.infura.io/v3/',
    chainId: 420,
  },
  optimismMainnet: {
    url: 'https://optimism-mainnet.infura.io/v3/',
    chainId: 10,
  },
  palmTestnet: {
    url: 'https://palm-testnet.infura.io/v3/',
    chainId: 11_297_108_099,
  },
  palmMainnet: {
    url: 'https://palm-mainnet.infura.io/v3/',
    chainId: 11_297_108_109,
  },
  arbitrumGoerli: {
    url: 'https://arbitrum-goerli.infura.io/v3/',
    chainId: 421_613,
  },
  arbitrumMainnet: {
    url: 'https://arbitrum-mainnet.infura.io/v3/',
    chainId: 42_161,
  },
  celoMainnet: {
    url: 'https://celo-mainnet.infura.io/v3/',
    chainId: 42_220,
  },
  celoAlfajores: {
    url: 'https://celo-alfajores.infura.io/v3/',
    chainId: 44_787,
  },
  avalancheCChain: {
    url: 'https://avalanche-mainnet.infura.io/v3/',
    chainId: 43_114,
  },
  avalancheCChainFuji: {
    url: 'https://avalanche-fuji.infura.io/v3/',
    chainId: 43_113,
  },
  starknetMainnet: {
    url: 'https://starknet-mainnet.infura.io/v3/',
    chainId: 0,
  },
  starknetGoerli: {
    url: 'https://starknet-goerli.infura.io/v3/',
    chainId: 0,
  },
}

class ExtendedInfuraProvider extends InfuraProvider {
  static getUrl(network: Network, apiKey: any): ConnectionInfo {
    return {
      allowGzip: true,
      url: ((network as ExtendedNetwork).url + apiKey.projectId),
    }
  }

  static getNetwork(network: Networkish): Network {
    if (typeof (network) === 'string') {
      return {
        ...networks[network as keyof typeof networks],
        name: network as string,
      }
    }

    return network as Network
  }
}

export const getProvider = function (
  network: string,
): BaseProvider {
  if (network === 'localhost' || network === 'hardhat') return getLocalhostProvider()

  if (process.env.INFURA_API_KEY) return new ExtendedInfuraProvider(network, process.env.INFURA_API_KEY)

  return getDefaultProvider(network)
}