import 'dotenv/config';
import * as dotenv from 'dotenv';
dotenv.config();

import { task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-contract-sizer';

import { checkGT } from './tasks/checkGT';
import { createGatekeeperNetwork } from './tasks/createGatekeeperNetwork';
import { addGatekeeper } from './tasks/addGatekeeper';
import { removeGatekeeper } from './tasks/removeGatekeeper';
import { issueGT } from './tasks/issueGT';
import { fund } from './tasks/fund';
import { printPrivateKey } from './tasks/printPrivateKey';
import { createWallet } from './tasks/createWallet';
import { addForwarder } from './tasks/addForwarder';
import { execute } from './tasks/execute';
import { getBalance } from './tasks/getBalance';

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

task('check-gt', 'check if a wallet has a gateway token for a particular gatekeeper network')
  .addParam('address', 'The wallet to check')
  .addParam('gatekeepernetwork', 'The gatekeeper network')
  .setAction(checkGT);
task('create-gatekeeper-network', 'create a gatekeeper network')
    .addParam('gatekeepernetwork', 'The gatekeeper network to create')
    .addParam('gatekeeper', 'The gatekeeper to add')
    .addParam('name', 'The name of the new gatekeeper network')
    .setAction(createGatekeeperNetwork);
task('add-gatekeeper', 'add a gatekeeper to a network')
  .addParam('gatekeeper', 'The gatekeeper to add')
  .addParam('gatekeepernetwork', 'The gatekeeper network to add the gatekeeper to')
  .setAction(addGatekeeper);
task('remove-gatekeeper', 'remove a gatekeeper from a network')
    .addParam('gatekeeper', 'The gatekeeper to remove')
    .addParam('gatekeepernetwork', 'The gatekeeper network to remove the gatekeeper from')
    .setAction(removeGatekeeper);
task('issue-gt', 'issue a gateway token')
  .addParam('gatekeepernetwork', 'The gatekeeper network to issue the token against')
  .addParam('address', 'The wallet to issue the gateway token for')
  .addFlag('forwarded', 'Forwards the transaction using an ERC2771 forwarder')
  .setAction(issueGT);
task('fund', 'fund a wallet')
  .addParam('from', 'The funder wallet')
  .addParam('to', 'The wallet to fund')
  .addParam('amount', 'The amount in eth to send')
  .addFlag('dryrun', 'Do not actually send the transaction')
  .setAction(fund);
task(
  'print-private-key',
  'Print the private key of a wallet used by hardhat (WARNING - DO NOT USE THIS FOR PRODUCTION KEYS)',
)
  .addParam('index', 'the index of the wallet to get the private key for')
  .setAction(printPrivateKey);
task('create-wallet', 'Create a test wallet').setAction(createWallet);
task('add-forwarder', 'add a forwarder to the gateway token smart contract (e.g. to support a relayer)')
  .addParam('forwarder', 'The forwarder to add')
  .setAction(addForwarder);
task('execute', 'sign and send a transaction')
  .addParam('tx', 'the transaction to sign as a hex string')
  .addParam('to', 'the recipient of the transaction')
  .addParam('value', 'the amount to send with the transaction')
  .setAction(execute);
task('get-balance', 'get the balance of the deployer').setAction(getBalance);

// Set the default contracts path to "contracts"
const defaultPath = './contracts';
const testContractsPath = './test/contracts';

// Override the default "compile" task to compile both main and test contracts
task('compile', 'Compiles the entire project, including main and test contracts')
  .addFlag('noTestContracts', "Don't compile test contracts")
  .setAction(async (args, hre, runSuper) => {
    // First, compile main contracts
    hre.config.paths.sources = defaultPath;
    await runSuper(args);

    // Then, compile test contracts (unless --noTestContracts flag is provided)
    if (!args.noTestContracts) {
      hre.config.paths.sources = testContractsPath;
      await runSuper(args);
    }
  });

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      accounts:
        process.env.NODE_ENV === 'test'
          ? derivedAccounts
          : liveAccounts.map((a) => ({ privateKey: a, balance: '10000000000000000000000' })),
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
      url: 'https://polygon-zkevm.drpc.org',
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
	gasPrice: 150000005
    },
    base: {
        url: 'https://base.llamarpc.com',
        accounts: liveAccounts,
        chainId: 8453,
    },
  },
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  contractSizer: {
    runOnCompile: true,
    strict: true,
  },
  paths: {
    sources: defaultPath,
    tests: './test',
    cache: './cache',
    artifacts: './build',
    deploy: './deploy',
    deployments: './deployments',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 15,
  },
  mocha: {
    timeout: 100000,
    // reporter: 'eth-gas-reporter',
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonZkEVM: process.env.POLYGONSCAN_API_KEY,
      polygonZkEVMTestnet: process.env.POLYGONSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumGoerli: process.env.ARBISCAN_API_KEY,
    },
    customChains: [
      {
        network: 'polygonZkEVM',
        urls: {
          apiURL: 'https://api-zkevm.polygonscan.com/api',
          browserURL: 'https://zkevm.polygonscan.com',
        },
        chainId: 1101,
      },
      {
        network: 'polygonZkEVMTestnet',
        urls: {
          apiURL: 'https://api-testnet-zkevm.polygonscan.com/api',
          browserURL: 'https://testnet-zkevm.polygonscan.com/',
        },
        chainId: 1442,
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    gatekeeper: {
      default: 2,
    },
  },
  typechain: {
    outDir: 'typechain-types',
    // target: 'ethers-v5',
    // alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    // externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    // dontOverrideCompile: false // defaults to false
    tsNocheck: true,
  },
};
