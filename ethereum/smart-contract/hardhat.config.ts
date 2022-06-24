import {task} from "hardhat/config";
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat'
import 'hardhat-deploy';
import 'hardhat-contract-sizer'
import * as dotenv from 'dotenv'

import { checkGT } from "./tasks/checkGT";
import { addGatekeeper } from "./tasks/addGatekeeper";
import {issueGT} from "./tasks/issueGT";

dotenv.config();

const derivedAccounts = {
  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
  path: process.env.MNEMONIC_PATH || "m/44'/60'/0'/0/",
  initialIndex: 0,
  count: 20,
}
const liveAccounts = [`0x${process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY}`, `0x${process.env.AUTHORITY_PRIVATE_KEY || process.env.PRIVATE_KEY}`];

task('check-gt', 'check if a wallet has a gateway token for a particular gatekeeper network')
  .addParam('address', 'The wallet to check')
  .setAction(checkGT)
task('add-gatekeeper', 'check if a wallet has a gateway token for a particular gatekeeper network')
  .addParam('gatekeeper', 'The gatekeeper to add')
  .addParam('gatekeepernetwork', 'The gatekeeper network smart contract to add the gatekeeper to')
  .setAction(addGatekeeper)
task('issue-gt', 'issue a gateway token')
  .addParam('gatekeepernetwork', 'The gatekeeper network smart contract to issue the token against')
  .addParam('address', 'The wallet to issue the gateway token for')
  .addFlag('forwarded', 'Forwards the transaction using an ERC2771 forwarder')
  .setAction(issueGT)

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
      accounts: derivedAccounts, 
    },
    localhost: {
      saveDeployments: true,
      accounts: derivedAccounts,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: liveAccounts,
      chainId: 1,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: liveAccounts,
      chainId: 3,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: liveAccounts,
      chainId: 4,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : accounts,
      chainId: 4,
    },
    polygonMumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : accounts,
      chainId: 1,
    },
    polygonMainnet: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
      saveDeployments: true,
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : accounts,
      chainId: 1,
    },
  },
  solidity: {
    version: "0.8.9",
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
    artifacts: "./build",
    deploy: "./deploy",
    deployments: "./deployments"
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 15
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
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    authority: {
      default: 1,
    },
    gatekeeper: {
      default: '0xcbaA8FDf9A9673850cf75E6E42B4eA1aDaA87688',
      localhost: 2,
      hardhat: 2
    },
  },
}