export const defaultPath = './contracts';

const derivedAccounts = {
    mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk',
    path: process.env.MNEMONIC_PATH || "m/44'/60'/0'/0/",
    initialIndex: 0,
    count: 20,
};
const liveAccounts =
    process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY
        ? [
            `0x${process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY}`,
            `0x${process.env.GATEKEEPER_PRIVATE_KEY || process.env.PRIVATE_KEY}`,
        ]
        : [];
export const networks = {
    hardhat: {
        allowUnlimitedContractSize: false,
        accounts:
            process.env.NODE_ENV === 'test'
                ? derivedAccounts
                : liveAccounts.map((a) => ({privateKey: a, balance: '10000000000000000000000'})),
    },
    localhost: {
        allowUnlimitedContractSize: false,
        accounts: liveAccounts,
    },
    mainnet: {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 1,
    },
    sepolia: {
        url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 11155111,
    },
    goerli: {
        url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 5,
    },
    polygonMumbai: {
        url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 80001,
    },
    polygonMainnet: {
        url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 137,
    },
    auroraTestnet: {
        url: `https://aurora-testnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 1313161555,
    },
    auroraMainnet: {
        url: `https://aurora-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 1313161554,
    },
    optimismGoerli: {
        url: `https://optimism-goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 420,
        // optimism goerli deployment is only reliable if a gas price is set - the gas oracles are not reliable
        gasPrice: 1_000_000_000,
    },
    optimismSepolia: {
        url: `https://sepolia.optimism.io`,
        accounts: liveAccounts,
        chainId: 11155420,
        // optimism sepolia deployment is only reliable if a gas price is set - the gas oracles are not reliable
        gasPrice: 1_000_000_000,
    },
    optimismMainnet: {
        url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 10,
    },
    palmTestnet: {
        url: `https://palm-testnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 11297108099,
    },
    palmMainnet: {
        url: `https://palm-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 11297108109,
    },
    arbitrumGoerli: {
        url: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 421613,
    },
    arbitrumSepolia: {
        url: `https://sepolia-rollup.arbitrum.io/rpc`,
        accounts: liveAccounts,
        chainId: 421614,
    },
    arbitrumMainnet: {
        url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 42161,
    },
    celoMainnet: {
        url: `https://celo-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 42220,
    },
    celoAlfajores: {
        url: `https://celo-alfajores.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 44787,
    },
    avalancheCChain: {
        url: `https://avalanche-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 43114,
    },
    avalancheCChainFuji: {
        url: `https://avalanche-fuji.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 43113,
    },
    starknetMainnet: {
        url: `https://starknet-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 0, // not documented anywhere
    },
    starknetGoerli: {
        url: `https://starknet-goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 0, // not documented anywhere
    },
    xdc: {
        url: 'https://erpc.xinfin.network',
        accounts: liveAccounts,
        chainId: 50,
    },
    xdcApothem: {
        url: 'https://erpc.apothem.network',
        accounts: liveAccounts,
        chainId: 51,
    },
    polygonZkEVM: {
        url: 'https://zkevm-rpc.com',
        accounts: liveAccounts,
        chainId: 1101,
    },
    polygonZkEVMTestnet: {
        url: 'https://rpc.public.zkevm-test.net',
        accounts: liveAccounts,
        chainId: 1442,
    },
    fantom: {
        url: 'https://rpcapi.fantom.network',
        accounts: liveAccounts,
        chainId: 250,
    },
    fantomTestnet: {
        url: 'https://rpc.testnet.fantom.network',
        accounts: liveAccounts,
        chainId: 4002,
    },
    baseSepolia: {
        url: 'https://sepolia.base.org',
        accounts: liveAccounts,
        chainId: 84532,
        // set a gas price - the gas oracles are not reliable
        gasPrice: 150000005,
    },
    base: {
        url: 'https://base.llamarpc.com',
        accounts: liveAccounts,
        chainId: 8453,
    },
    bsc: {
        // url: `https://bnbsmartchain-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        url: 'https://bsc-dataseed1.bnbchain.org',
        accounts: liveAccounts,
        chainId: 56,
    },
    bscTestnet: {
        // url: `https://bnbsmartchain-testnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        url: 'https://bsc-testnet.publicnode.com',
        accounts: liveAccounts,
        chainId: 97,
    },
    linea: {
        url: `https://linea-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 59144,
    },
    lineaGoerli: {
        url: `https://linea-goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
        accounts: liveAccounts,
        chainId: 59140,
    },
    gnosis: {
        url: 'https://rpc.gnosischain.com',
        accounts: liveAccounts,
        chainId: 100
    },
    gnosisChiado: {
        url: 'https://rpc.chiadochain.net',
        accounts: liveAccounts,
        chainId: 10200,
        gasPrice: 1500000005,
    },
    klaytn: {
        url: 'https://public-en-cypress.klaytn.net',
        accounts: liveAccounts,
        chainId: 8217,
    },
    klaytnBaobab: {
        url: 'https://api.baobab.klaytn.net:8651',
        accounts: liveAccounts,
        chainId: 1001,
    },
    zkSync: {
        url: 'https://mainnet.era.zksync.io',
        accounts: liveAccounts,
        chainId: 324,
    },
    zkSyncGoerli: {
        url: 'https://testnet.era.zksync.dev',
        accounts: liveAccounts,
        chainId: 280,
    },
};