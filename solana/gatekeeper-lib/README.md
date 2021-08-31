# gatekeeper-lib

Library and CLI to manage OCIV Gateway Tokens

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/ociv.svg)](https://npmjs.org/package/ociv)
[![Downloads/week](https://img.shields.io/npm/dw/ociv.svg)](https://npmjs.org/package/ociv)
[![License](https://img.shields.io/npm/l/ociv.svg)](https://github.com/identity-com/ociv/blob/master/package.json)

<!-- toc -->
* [gatekeeper-lib](#gatekeeper-lib)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @identity.com/solana-gatekeeper-lib
$ gateway COMMAND
running command...
$ gateway (-v|--version|version)
@identity.com/solana-gatekeeper-lib/1.1.0 darwin-x64 node-v14.17.5
$ gateway --help [COMMAND]
USAGE
  $ gateway COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway add-gatekeeper ADDRESS`](#gateway-add-gatekeeper-address)
* [`gateway freeze GATEWAYTOKEN`](#gateway-freeze-gatewaytoken)
* [`gateway help [COMMAND]`](#gateway-help-command)
* [`gateway issue ADDRESS`](#gateway-issue-address)
* [`gateway refresh GATEWAYTOKEN [EXPIRY]`](#gateway-refresh-gatewaytoken-expiry)
* [`gateway revoke GATEWAYTOKEN`](#gateway-revoke-gatewaytoken)
* [`gateway revoke-gatekeeper ADDRESS`](#gateway-revoke-gatekeeper-address)
* [`gateway unfreeze GATEWAYTOKEN`](#gateway-unfreeze-gatewaytoken)
* [`gateway verify OWNER`](#gateway-verify-owner)

## `gateway add-gatekeeper ADDRESS`

Add a gatekeeper to a network

```
USAGE
  $ gateway add-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to add to the network

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The private key file for the gatekeeper
                                                   authority

EXAMPLE
  $ gateway add-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/add-gatekeeper.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/add-gatekeeper.ts)_

## `gateway freeze GATEWAYTOKEN`

Freeze a gateway token

```
USAGE
  $ gateway freeze GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to freeze

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Frozen
```

_See code: [dist/commands/freeze.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/freeze.ts)_

## `gateway help [COMMAND]`

display help for gateway

```
USAGE
  $ gateway help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `gateway issue ADDRESS`

Issue a gateway token to a wallet

```
USAGE
  $ gateway issue ADDRESS

ARGUMENTS
  ADDRESS  The address to issue the token to

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -e, --expiry=expiry                              The expiry time in seconds for the gateway token (default none)

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/issue.ts)_

## `gateway refresh GATEWAYTOKEN [EXPIRY]`

Freeze a gateway token

```
USAGE
  $ gateway refresh GATEWAYTOKEN [EXPIRY]

ARGUMENTS
  GATEWAYTOKEN  The gateway token to freeze
  EXPIRY        [default: 54000] The new expiry time in seconds for the gateway token (default 15 minutes)

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway refresh EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv 54000
  Refreshed
```

_See code: [dist/commands/refresh.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/refresh.ts)_

## `gateway revoke GATEWAYTOKEN`

Revoke a gateway token

```
USAGE
  $ gateway revoke GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to revoke

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/revoke.ts)_

## `gateway revoke-gatekeeper ADDRESS`

Revoke a gatekeeper from a network

```
USAGE
  $ gateway revoke-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to revoke from the network

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The private key file for the gatekeeper
                                                   authority

EXAMPLE
  $ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/revoke-gatekeeper.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/revoke-gatekeeper.ts)_

## `gateway unfreeze GATEWAYTOKEN`

Unfreeze a gateway token

```
USAGE
  $ gateway unfreeze GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to unfreeze

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -g, --gatekeeperKey=gatekeeperKey                [default: [object Object]] The private key file for the gatekeeper
                                                   authority

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway unfreeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Unfrozen
```

_See code: [dist/commands/unfreeze.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/unfreeze.ts)_

## `gateway verify OWNER`

Verify a gateway token

```
USAGE
  $ gateway verify OWNER

ARGUMENTS
  OWNER  The gateway token to revoke

OPTIONS
  -c, --cluster=cluster                            [default: http://ec2-34-238-243-215.compute-1.amazonaws.com:8899] The
                                                   cluster to target: mainnet-beta, testnet, devnet, civicnet, localnet.
                                                   Alternatively, set the environment variable SOLANA_CLUSTER

  -h, --help                                       show CLI help

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey  [default: [object Object]] The public key (in base 58) of the
                                                   gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  {
    "issuingGatekeeper": "tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp",
    "gatekeeperNetwork": "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv",
    "owner": "EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv",
    "state": "ACTIVE",
    "publicKey": "3rNZ6RzH6jLCzFeySVDc8Z82sJkeQ4xi7BCUzjpZBvZr",
    "programId": "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
  }
```

_See code: [dist/commands/verify.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.1.0/dist/commands/verify.ts)_
<!-- commandsstop -->
