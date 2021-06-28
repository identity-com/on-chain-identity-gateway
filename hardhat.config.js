require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("solidity-coverage");
require('hardhat-contract-sizer');

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    development: {
      url: 'http://0.0.0.0:8545', // Localhost (default: none)
      chainId: 1337,
      // port: 8545, // Standard Ethereum port (default: none)
      // network_id: '*', // Any network (default: none)
    },
  },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./build"
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 125
  },
  mocha: {
    timeout: 100000,
    // reporter: 'eth-gas-reporter',
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },
}