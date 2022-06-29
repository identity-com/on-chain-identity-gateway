# gateway-eth-ts

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/gateway-eth-ts.svg)](https://www.npmjs.com/package/@identity.com/gateway-eth-ts)
[![Downloads/week](https://img.shields.io/npm/dw/gateway-eth-ts.svg)](https://www.npmjs.com/package/@identity.com/gateway-eth-ts)
[![License](https://img.shields.io/npm/l/gateway-eth-ts.svg)](https://github.com/identity-com/on-chain-identity-gateway/blob/main/ethereum/gateway-eth-ts/package.json)

# Gateway ETH TS library

This client library allows JS/TS applications to communicate with Gateway token system on Ethereum blockchain. Common methods include validation of existing tokens, new gateway token issuance, token freezing/unfreezing and revokation.

## Installation

`yarn add @identity.com/gateway-eth-ts`

## Metamask integration example

```
import {
  GatewayTs,
} from "@identity.com/gateway-eth-ts";
import {
  getDefaultProvider,
  Wallet,
  providers
} = from 'ethers';
import { useWallet } from 'use-wallet';


(async function() {
  const { ethereum } = useWallet();
  const chainId = Number(ethereum.chainId);
  const provider = new ethers.providers.Web3Provider(
      ethereum,
      chainId
  );
  const signer = provider.getSigner();
  const network = await provider.getNetwork();
  const gateway = new GatewayTs(gatekeeper, network, DEFAULT_GATEWAY_TOKEN_ADDRESS);
  const testUser = '0xD42Ef952F2EA1E77a8b771884f15Bf20e35cF85f';
  await (await gateway.issue(testUser)).wait();
})();
```
# Gateway ETH TS library CLI

## Usage

<!-- usage -->
```sh-session
$ npm install -g @identity.com/gateway-eth-ts
$ gateway-eth-ts COMMAND
running command...
$ gateway-eth-ts (-v|--version|version)
@identity.com/gateway-eth-ts/0.2.0-alpha.6 darwin-x64 node-v16.14.2
$ gateway-eth-ts --help [COMMAND]
USAGE
  $ gateway-eth-ts COMMAND
...
```
<!-- usagestop -->

## Commands

<!-- commands -->
* [`gateway-eth-ts add-gatekeeper ADDRESS`](#gateway-eth-ts-add-gatekeeper-address)
* [`gateway-eth-ts add-network-authority ADDRESS`](#gateway-eth-ts-add-network-authority-address)
* [`gateway-eth-ts burn ADDRESS`](#gateway-eth-ts-burn-address)
* [`gateway-eth-ts freeze ADDRESS`](#gateway-eth-ts-freeze-address)
* [`gateway-eth-ts get-token ADDRESS`](#gateway-eth-ts-get-token-address)
* [`gateway-eth-ts help [COMMAND]`](#gateway-eth-ts-help-command)
* [`gateway-eth-ts issue ADDRESS [EXPIRATION]`](#gateway-eth-ts-issue-address-expiration)
* [`gateway-eth-ts refresh ADDRESS [EXPIRY]`](#gateway-eth-ts-refresh-address-expiry)
* [`gateway-eth-ts remove-gatekeeper ADDRESS`](#gateway-eth-ts-remove-gatekeeper-address)
* [`gateway-eth-ts remove-network-authority ADDRESS`](#gateway-eth-ts-remove-network-authority-address)
* [`gateway-eth-ts revoke ADDRESS`](#gateway-eth-ts-revoke-address)
* [`gateway-eth-ts unfreeze ADDRESS`](#gateway-eth-ts-unfreeze-address)
* [`gateway-eth-ts version`](#gateway-eth-ts-version)

## `gateway-eth-ts add-gatekeeper ADDRESS`

Add a gatekeeper to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts add-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  Gatekeeper address to add to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway add-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/add-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/add-gatekeeper.ts)_

## `gateway-eth-ts add-network-authority ADDRESS`

Add a network authority to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts add-network-authority ADDRESS

ARGUMENTS
  ADDRESS  Network authority address to add to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/add-network-authority.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/add-network-authority.ts)_

## `gateway-eth-ts burn ADDRESS`

Burn existing gateway token

```
USAGE
  $ gateway-eth-ts burn ADDRESS

ARGUMENTS
  ADDRESS  Owner ethereum address to burn the token for

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway burn 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/burn.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/burn.ts)_

## `gateway-eth-ts freeze ADDRESS`

Freeze existing gateway token

```
USAGE
  $ gateway-eth-ts freeze ADDRESS

ARGUMENTS
  ADDRESS  Owner ethereum address to freeze the token for

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway freeze 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/freeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/freeze.ts)_

## `gateway-eth-ts get-token ADDRESS`

Get existing gateway token

```
USAGE
  $ gateway-eth-ts get-token ADDRESS

ARGUMENTS
  ADDRESS  Owner ethereum address to get the token for

OPTIONS
  -h, --help                                          Show CLI help.
  -i, --tokenID=tokenID                               Token ID number to issue
  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with
  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

ALIASES
  $ gateway-eth-ts verify

EXAMPLE
  $ gateway get 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/get-token.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/get-token.ts)_

## `gateway-eth-ts help [COMMAND]`

display help for gateway-eth-ts

```
USAGE
  $ gateway-eth-ts help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.14/src/commands/help.ts)_

## `gateway-eth-ts issue ADDRESS [EXPIRATION]`

Issue new gateway token with TokenID for Ethereum address

```
USAGE
  $ gateway-eth-ts issue ADDRESS [EXPIRATION]

ARGUMENTS
  ADDRESS     Owner ethereum address to issue the token to
  EXPIRATION  [default: [object Object]] Expiration timestamp for newly issued token

OPTIONS
  -b, --bitmask=bitmask                               [default: [object Object]] Bitmask constraints to link with newly
                                                      minting tokenID

  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/issue.ts)_

## `gateway-eth-ts refresh ADDRESS [EXPIRY]`

Refresh existing gateway token for Ethereum address

```
USAGE
  $ gateway-eth-ts refresh ADDRESS [EXPIRY]

ARGUMENTS
  ADDRESS  Owner ethereum address to refresh the token for
  EXPIRY   The new expiry time in seconds for the gateway token (default 14 days)

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway refresh 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 60
```

_See code: [dist/commands/refresh.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/refresh.ts)_

## `gateway-eth-ts remove-gatekeeper ADDRESS`

Remove a gatekeeper from a GatewayToken contract

```
USAGE
  $ gateway-eth-ts remove-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  Gatekeeper address to remove to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/remove-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/remove-gatekeeper.ts)_

## `gateway-eth-ts remove-network-authority ADDRESS`

Remove a network authority to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts remove-network-authority ADDRESS

ARGUMENTS
  ADDRESS  Network authority address to remove from the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/remove-network-authority.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/remove-network-authority.ts)_

## `gateway-eth-ts revoke ADDRESS`

Revoke existing gateway token by TokenID

```
USAGE
  $ gateway-eth-ts revoke ADDRESS

ARGUMENTS
  ADDRESS  Owner ethereum address to revoke the token for

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway revoke 10
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/revoke.ts)_

## `gateway-eth-ts unfreeze ADDRESS`

Unfreeze existing gateway token

```
USAGE
  $ gateway-eth-ts unfreeze ADDRESS

ARGUMENTS
  ADDRESS  Owner ethereum address to unfreeze the token for

OPTIONS
  -c, --confirmations=confirmations                   [default: [object Object]] The amount of blocks to wait for mined
                                                      transaction

  -f, --gasPriceFee=gasPriceFee                       [default: [object Object]] Gas Price level to execute transaction
                                                      with. For example: instant, fast, standard, slow

  -h, --help                                          Show CLI help.

  -i, --tokenID=tokenID                               Token ID number to issue

  -n, --network=mainnet|rinkeby|ropsten|kovan|goerli  [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                         The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress       GatewayToken address to target

EXAMPLE
  $ gateway unfreeze 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/unfreeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.2.0-alpha.6/dist/commands/unfreeze.ts)_

## `gateway-eth-ts version`

```
USAGE
  $ gateway-eth-ts version
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.0.4/src/commands/version.ts)_
<!-- commandsstop -->

- [`gateway-eth-ts add-gatekeeper ADDRESS`](#gateway-eth-ts-add-gatekeeper-address)

## Utility functions

### Token ID generation

To issue a new token a library prepares a token ID for user, based on user's ETH address and additional constraints.
The first 20 bytes of address are concatenated to a bytes32 string on the right side. Constraints concateneted to the left side, those constraints are limited to 12 bytes.

Typically constraints are reflected as the number of gateway tokens created for user.

For example for `0xD42Ef952F2EA1E77a8b771884f15Bf20e35cF85f` address gateway token ids would be generated in a following sequence:

> 0x**01**d42ef952f2ea1e77a8b771884f15bf20e35cf85f =>
> 0x**02**d42ef952f2ea1e77a8b771884f15bf20e35cf85f =>
> 0x**03**d42ef952f2ea1e77a8b771884f15bf20e35cf85f ...

### Token bitmask construction

The easiest way to associate certain flags with the gateway token is by using list of supported KYC flags, and `addFlagsToBitmask` function.

```
  flags = [KYCFlags.IDCOM_1];
  bitmask = addFlagsToBitmask(bitmask, flags);
```
