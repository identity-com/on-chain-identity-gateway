import 'dotenv/config';
import * as dotenv from 'dotenv';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-solhint';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-contract-sizer';
import './config/tasks';
import {defaultPath, networks} from "./config/networks";

dotenv.config();

module.exports = {
  defaultNetwork: 'hardhat',
  networks,
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
