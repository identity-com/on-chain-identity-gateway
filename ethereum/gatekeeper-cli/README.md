Gateway ETH CLI
=================

CLI for the Gateway Protocol on EVM chains.

For more detail, see the [Gateway Protocol](https://github.com/identity-com/on-chain-identity-gateway)

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Quick Start](#quick-start)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Quick Start

```shell
yarn global add @identity.com/gateway-eth-cli
```

TIP: run `gateway-eth <command> -h` to see all options at any time.

TIP: The CLI uses Infura. Add an infura API key to your environment to avoid rate-limiting:

```shell
export INFURA_API_KEY=your-api-key
```

## Add a gatekeeper

This command will add yourself as a gatekeeper to the test gatekeeper network on Goerli, using the
built-in test network authority key.

```shell
gateway-eth add-gatekeeper -c goerli <your address>
```

To use a gatekeeper other than the test gatekeeper network, set the network using the -n flag.
To default to a given network, set the `DEFAULT_GATEKEEPER_NETWORK` environment variable.

## Issue a pass

Once you are a gatekeeper, you can issue passes.

```shell
gateway-eth issue -c goerli <pass recipient address>
```

## Listen to pass changes

TIP: Set the DEFAULT_CHAIN environment variable to avoid having to specify the chain with every command.

```shell
export DEFAULT_CHAIN=goerli

gateway-eth listen <owner>
```

## Create a Gatekeeper Network

To create a gatekeeper network, find an unused ID, and register it with a name.

NOTE: Consult with identity.com about listing the gatekeeper network, in order to avoid collisions.

```shell
gateway-eth create-gatekeeper-network -c goerli <id> <name>
```

# Usage
<!-- usage -->
```sh-session
$ npm install -g @identity.com/gateway-eth-cli
$ gateway-eth COMMAND
running command...
$ gateway-eth (--version)
@identity.com/gateway-eth-cli/0.0.10 darwin-arm64 node-v16.17.1
$ gateway-eth --help [COMMAND]
USAGE
  $ gateway-eth COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway-eth add-gatekeeper ADDRESS`](#gateway-eth-add-gatekeeper-address)
* [`gateway-eth add-network-authority ADDRESS`](#gateway-eth-add-network-authority-address)
* [`gateway-eth create-gatekeeper-network ID NAME`](#gateway-eth-create-gatekeeper-network-id-name)
* [`gateway-eth freeze ADDRESS`](#gateway-eth-freeze-address)
* [`gateway-eth get-gatekeeper-network ID`](#gateway-eth-get-gatekeeper-network-id)
* [`gateway-eth get-token ADDRESS`](#gateway-eth-get-token-address)
* [`gateway-eth help [COMMAND]`](#gateway-eth-help-command)
* [`gateway-eth issue ADDRESS [EXPIRY]`](#gateway-eth-issue-address-expiry)
* [`gateway-eth listen ADDRESS`](#gateway-eth-listen-address)
* [`gateway-eth refresh ADDRESS [EXPIRY]`](#gateway-eth-refresh-address-expiry)
* [`gateway-eth remove-gatekeeper ADDRESS`](#gateway-eth-remove-gatekeeper-address)
* [`gateway-eth remove-network-authority ADDRESS`](#gateway-eth-remove-network-authority-address)
* [`gateway-eth revoke ADDRESS`](#gateway-eth-revoke-address)
* [`gateway-eth unfreeze ADDRESS`](#gateway-eth-unfreeze-address)
* [`gateway-eth verify ADDRESS`](#gateway-eth-verify-address)

## `gateway-eth add-gatekeeper ADDRESS`

Add a gatekeeper to a gatekeeper network

```
USAGE
  $ gateway-eth add-gatekeeper [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Gatekeeper address to add to the gatekeeper network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Add a gatekeeper to a gatekeeper network

EXAMPLES
  $ gateway-eth add-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/add-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/add-gatekeeper.ts)_

## `gateway-eth add-network-authority ADDRESS`

Add a network authority to a GatewayToken contract

```
USAGE
  $ gateway-eth add-network-authority [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Network authority address to add to the gatekeeper network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Add a network authority to a GatewayToken contract

EXAMPLES
  $ gateway-eth add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/add-network-authority.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/add-network-authority.ts)_

## `gateway-eth create-gatekeeper-network ID NAME`

Create a new gatekeeper network

```
USAGE
  $ gateway-eth create-gatekeeper-network [ID] [NAME] [-h] [-p <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-t <value>] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ID    ID of the new network
  NAME  Name of the new network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Create a new gatekeeper network

EXAMPLES
  $ gateway-eth create-gatekeeper-network <name> <number>
```

_See code: [dist/commands/create-gatekeeper-network.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/create-gatekeeper-network.ts)_

## `gateway-eth freeze ADDRESS`

Freeze existing gateway token

```
USAGE
  $ gateway-eth freeze [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Freeze existing gateway token

EXAMPLES
  $ gateway-eth freeze 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/freeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/freeze.ts)_

## `gateway-eth get-gatekeeper-network ID`

Check if a gatekeeper network exists

```
USAGE
  $ gateway-eth get-gatekeeper-network [ID] [-h] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-t <value>]

ARGUMENTS
  ID  ID of the network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -h, --help
      Show CLI help.

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

DESCRIPTION
  Check if a gatekeeper network exists

EXAMPLES
  $ gateway-eth get-gatekeeper-network <number>
```

_See code: [dist/commands/get-gatekeeper-network.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/get-gatekeeper-network.ts)_

## `gateway-eth get-token ADDRESS`

Get existing gateway token

```
USAGE
  $ gateway-eth get-token [ADDRESS] [-h] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

DESCRIPTION
  Get existing gateway token

ALIASES
  $ gateway-eth verify

EXAMPLES
  $ gateway-eth get 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/get-token.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/get-token.ts)_

## `gateway-eth help [COMMAND]`

Display help for gateway-eth.

```
USAGE
  $ gateway-eth help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for gateway-eth.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.22/src/commands/help.ts)_

## `gateway-eth issue ADDRESS [EXPIRY]`

Issue a new gateway token for a given owner address and gatekeeper network

```
USAGE
  $ gateway-eth issue [ADDRESS] [EXPIRY] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-w <value>] [-g <value>] [-b <value>] [-u
    <value>]

ARGUMENTS
  ADDRESS  Token owner address
  EXPIRY   [default: [object Object]] Expiry timestamp for the issued token

FLAGS
  -b, --bitmask=<value>
      [default: [object Object]] Bitmask constraints to link with newly minting token

  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -u, --uri=<value>
      TokenURI to link with the issued token

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Issue a new gateway token for a given owner address and gatekeeper network

EXAMPLES
  $ gateway-eth issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/issue.ts)_

## `gateway-eth listen ADDRESS`

Listen to changes on a gateway token

```
USAGE
  $ gateway-eth listen [ADDRESS] [-h] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

DESCRIPTION
  Listen to changes on a gateway token

EXAMPLES
  $ gateway-eth listen 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/listen.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/listen.ts)_

## `gateway-eth refresh ADDRESS [EXPIRY]`

Refresh existing gateway token for Ethereum address

```
USAGE
  $ gateway-eth refresh [ADDRESS] [EXPIRY] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Token owner address
  EXPIRY   [default: [object Object]] Expiry timestamp for newly issued token

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Refresh existing gateway token for Ethereum address

EXAMPLES
  $ gateway-eth refresh 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 60 -n 123
```

_See code: [dist/commands/refresh.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/refresh.ts)_

## `gateway-eth remove-gatekeeper ADDRESS`

Remove a gatekeeper from a gatekeeper network

```
USAGE
  $ gateway-eth remove-gatekeeper [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Gatekeeper address to remove from the gatekeeper network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Remove a gatekeeper from a gatekeeper network

EXAMPLES
  $ gateway-eth remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/remove-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/remove-gatekeeper.ts)_

## `gateway-eth remove-network-authority ADDRESS`

Remove a network authority from a gatekeeper network

```
USAGE
  $ gateway-eth remove-network-authority [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Network authority address to add to the gatekeeper network

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Remove a network authority from a gatekeeper network

EXAMPLES
  $ gateway-eth remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/remove-network-authority.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/remove-network-authority.ts)_

## `gateway-eth revoke ADDRESS`

Burn existing gateway token

```
USAGE
  $ gateway-eth revoke [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Burn existing gateway token

EXAMPLES
  $ gateway-eth revoke 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/revoke.ts)_

## `gateway-eth unfreeze ADDRESS`

Unfreezing existing gateway token

```
USAGE
  $ gateway-eth unfreeze [ADDRESS] [-h] [-p <value>] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem] [-f <value>] [-g <value>] [-w <value>]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -f, --fees=<value>
      Gas Price level to execute transaction with. For example: instant, fast, standard, slow

  -g, --gasLimit=<value>
      Gas limit to set for the transaction. Required only for chains/providers that do not support eth_estimateGas

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -p, --privateKey=<value>
      [default: 0xf1ddf80d2b5d038bc2ab7ae9a26e017d2252218dc687ab72d45f84bfbee2957d] The ethereum address private key for
      signing messages (or set PRIVATE_KEY environment variable)

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

  -w, --confirmations=<value>
      [default: 1] The amount of blocks to wait for mined transaction

DESCRIPTION
  Unfreezing existing gateway token

EXAMPLES
  $ gateway-eth unfreeze 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```

_See code: [dist/commands/unfreeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.10/dist/commands/unfreeze.ts)_

## `gateway-eth verify ADDRESS`

Get existing gateway token

```
USAGE
  $ gateway-eth verify [ADDRESS] [-h] [-t <value>] [-n <value>] [-c
    localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|optimismMai
    nnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|avalancheCChai
    nFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem]

ARGUMENTS
  ADDRESS  Token owner address

FLAGS
  -c, --chain=<option>
      [default: [object Object]] Specify target chain to work with (or set DEFAULT_CHAIN environment variable)
      <options: localhost|mainnet|sepolia|goerli|polygonMumbai|polygonMainnet|auroraTestnet|auroraMainnet|optimismGoerli|o
      ptimismMainnet|palmTestnet|palmMainnet|arbitrumGoerli|arbitrumMainnet|celoMainnet|celoAlfajores|avalancheCChain|aval
      ancheCChainFuji|starknetMainnet|starknetGoerli|xdc|xdcApothem>

  -h, --help
      Show CLI help.

  -n, --gatekeeperNetwork=<value>
      [default: 1] Gatekeeper network. Defaults to the test Gatekeeper Network

  -t, --gatewayTokenAddress=<value>
      [default: 0x48EB506441da92b4951D56716422b348dB201048] GatewayToken address to target (or set GATEWAY_TOKEN_ADDRESS
      environment variable)

DESCRIPTION
  Get existing gateway token

ALIASES
  $ gateway-eth verify

EXAMPLES
  $ gateway-eth get 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -n 123
```
<!-- commandsstop -->
