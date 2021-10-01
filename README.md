gateway-eth-ts
========



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/gateway-eth-ts.svg)](https://npmjs.org/package/gateway-eth-ts)
[![Downloads/week](https://img.shields.io/npm/dw/gateway-eth-ts.svg)](https://npmjs.org/package/gateway-eth-ts)
[![License](https://img.shields.io/npm/l/gateway-eth-ts.svg)](https://github.com/Secured-Finance/gateway-eth-ts/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @identity.com/gateway-eth-ts
$ gateway-eth-ts COMMAND
running command...
$ gateway-eth-ts (-v|--version|version)
@identity.com/gateway-eth-ts/0.0.2 darwin-x64 node-v12.18.4
$ gateway-eth-ts --help [COMMAND]
USAGE
  $ gateway-eth-ts COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway-eth-ts add-gatekeeper ADDRESS`](#gateway-eth-ts-add-gatekeeper-address)
* [`gateway-eth-ts add-network-authority ADDRESS`](#gateway-eth-ts-add-network-authority-address)
* [`gateway-eth-ts blacklist ADDRESS`](#gateway-eth-ts-blacklist-address)
* [`gateway-eth-ts burn TOKENID`](#gateway-eth-ts-burn-tokenid)
* [`gateway-eth-ts freeze TOKENID`](#gateway-eth-ts-freeze-tokenid)
* [`gateway-eth-ts get-token TOKENID`](#gateway-eth-ts-get-token-tokenid)
* [`gateway-eth-ts get-token-id ADDRESS`](#gateway-eth-ts-get-token-id-address)
* [`gateway-eth-ts help [COMMAND]`](#gateway-eth-ts-help-command)
* [`gateway-eth-ts issue ADDRESS [EXPIRATION] [CONSTRAINS]`](#gateway-eth-ts-issue-address-expiration-constrains)
* [`gateway-eth-ts refresh TOKENID [EXPIRY]`](#gateway-eth-ts-refresh-tokenid-expiry)
* [`gateway-eth-ts remove-gatekeeper ADDRESS`](#gateway-eth-ts-remove-gatekeeper-address)
* [`gateway-eth-ts remove-network-authority ADDRESS`](#gateway-eth-ts-remove-network-authority-address)
* [`gateway-eth-ts revoke TOKENID`](#gateway-eth-ts-revoke-tokenid)
* [`gateway-eth-ts unfreeze TOKENID`](#gateway-eth-ts-unfreeze-tokenid)
* [`gateway-eth-ts verify ADDRESS [TOKENID]`](#gateway-eth-ts-verify-address-tokenid)

## `gateway-eth-ts add-gatekeeper ADDRESS`

Add a gatekeeper to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts add-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  Gatekeeper address to add to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway add-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/add-gatekeeper.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/add-gatekeeper.js)_

## `gateway-eth-ts add-network-authority ADDRESS`

Add a network authority to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts add-network-authority ADDRESS

ARGUMENTS
  ADDRESS  Network authority address to add to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway add-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/add-network-authority.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/add-network-authority.js)_

## `gateway-eth-ts blacklist ADDRESS`

Blacklist user globaly in the gateway token system

```
USAGE
  $ gateway-eth-ts blacklist ADDRESS

ARGUMENTS
  ADDRESS  User ETH address to blacklist

OPTIONS
  -c, --confirmations=confirmations  [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee      [default: [object Object]] Gas Price level to execute transaction with. For
                                     example: instant, fast, standard, slow

  -h, --help                         show CLI help

  -n, --network=network              [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey        [default: test test test test test test test test test test test junk] The ethereum
                                     address private key for signing messages

EXAMPLE
  $ gateway blacklist 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/blacklist.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/blacklist.js)_

## `gateway-eth-ts burn TOKENID`

Burn existing identity token using TokenID

```
USAGE
  $ gateway-eth-ts burn TOKENID

ARGUMENTS
  TOKENID  Token ID number to burn

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway burn 10
```

_See code: [dist/commands/burn.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/burn.js)_

## `gateway-eth-ts freeze TOKENID`

Freeze existing identity token using TokenID

```
USAGE
  $ gateway-eth-ts freeze TOKENID

ARGUMENTS
  TOKENID  Token ID number to freeze

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway freeze 10
```

_See code: [dist/commands/freeze.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/freeze.js)_

## `gateway-eth-ts get-token TOKENID`

Get information related to gateway token by tokenID

```
USAGE
  $ gateway-eth-ts get-token TOKENID

ARGUMENTS
  TOKENID  Owner address to verify identity token for

OPTIONS
  -h, --help                                     show CLI help
  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway get-token 10
```

_See code: [dist/commands/get-token.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/get-token.js)_

## `gateway-eth-ts get-token-id ADDRESS`

Get default gateway token ID by owner's address

```
USAGE
  $ gateway-eth-ts get-token-id ADDRESS

ARGUMENTS
  ADDRESS  Owner address to verify identity token for

OPTIONS
  -h, --help                                     show CLI help
  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway get-token-id 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/get-token-id.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/get-token-id.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `gateway-eth-ts issue ADDRESS [EXPIRATION] [CONSTRAINS]`

Issue new identity token with TokenID for Ethereum address

```
USAGE
  $ gateway-eth-ts issue ADDRESS [EXPIRATION] [CONSTRAINS]

ARGUMENTS
  ADDRESS     Owner ethereum address to tokenID for
  EXPIRATION  [default: 0] Expiration timestamp for newly issued token
  CONSTRAINS  [default: [object Object]] Constrains to generate tokenId

OPTIONS
  -b, --bitmask=bitmask                          [default: [object Object]] Bitmask constrains to link with newly
                                                 minting tokenID

  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -g, --[no-]generateTokenId                     Identifier used to determine wether tokenId has to be generated

  -h, --help                                     show CLI help

  -i, --tokenID=tokenID                          Token ID number to issue

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway issue 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94 -i <TokenID>
```

_See code: [dist/commands/issue.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/issue.js)_

## `gateway-eth-ts refresh TOKENID [EXPIRY]`

Refresh existing identity token with TokenID for Ethereum address

```
USAGE
  $ gateway-eth-ts refresh TOKENID [EXPIRY]

ARGUMENTS
  TOKENID  Token ID number to refresh
  EXPIRY   The new expiry time in seconds for the gateway token (default 14 days)

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway refresh 10 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/refresh.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/refresh.js)_

## `gateway-eth-ts remove-gatekeeper ADDRESS`

Remove gatekeeper to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts remove-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  Gatekeeper address to remove to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway remove-gatekeeper 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/remove-gatekeeper.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/remove-gatekeeper.js)_

## `gateway-eth-ts remove-network-authority ADDRESS`

Remove network authority to a GatewayToken contract

```
USAGE
  $ gateway-eth-ts remove-network-authority ADDRESS

ARGUMENTS
  ADDRESS  Network authority address to remove to the GatewayToken contract

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway remove-network-authority 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/remove-network-authority.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/remove-network-authority.js)_

## `gateway-eth-ts revoke TOKENID`

Revoke existing identity token by TokenID

```
USAGE
  $ gateway-eth-ts revoke TOKENID

ARGUMENTS
  TOKENID  Token ID number to revoke

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway revoke 10
```

_See code: [dist/commands/revoke.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/revoke.js)_

## `gateway-eth-ts unfreeze TOKENID`

Unfreeze existing identity token using TokenID

```
USAGE
  $ gateway-eth-ts unfreeze TOKENID

ARGUMENTS
  TOKENID  Token ID number to unfreeze

OPTIONS
  -c, --confirmations=confirmations              [default: 0] The amount of blocks to wait mined transaction

  -f, --gasPriceFee=gasPriceFee                  [default: [object Object]] Gas Price level to execute transaction with.
                                                 For example: instant, fast, standard, slow

  -h, --help                                     show CLI help

  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway unfreeze 10
```

_See code: [dist/commands/unfreeze.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/unfreeze.js)_

## `gateway-eth-ts verify ADDRESS [TOKENID]`

Verify existing identity using token owner address

```
USAGE
  $ gateway-eth-ts verify ADDRESS [TOKENID]

ARGUMENTS
  ADDRESS  Owner address to verify identity token for
  TOKENID  Token ID to verify identity for

OPTIONS
  -h, --help                                     show CLI help
  -n, --network=network                          [default: [object Object]] Specify target network to work with

  -p, --privateKey=privateKey                    [default: test test test test test test test test test test test junk]
                                                 The ethereum address private key for signing messages

  -t, --gatewayTokenAddress=gatewayTokenAddress  [default: 0xfD745e67635A8c394C5644E676D2B507d60380DF] GatewayToken
                                                 address to target

EXAMPLE
  $ gateway verify 0x893F4Be53274353CD3379C87C8fd1cb4f8458F94
```

_See code: [dist/commands/verify.js](https://github.com/secured-finance/gateway-eth-ts/blob/v0.0.2/dist/commands/verify.js)_
<!-- commandsstop -->
* [`gateway-eth-ts add-gatekeeper ADDRESS`](#gateway-eth-ts-add-gatekeeper-address)
