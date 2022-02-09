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
$ npm install -g @identity.com/casper-gatekeeper-lib
$ gateway COMMAND
running command...
$ gateway (-v|--version|version)
@identity.com/casper-gatekeeper-lib/0.1.4 darwin-x64 node-v16.0.0
$ gateway --help [COMMAND]
USAGE
  $ gateway COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway add-admin ADDRESS`](#gateway-add-admin-address)
* [`gateway add-gatekeeper ADDRESS`](#gateway-add-gatekeeper-address)
* [`gateway freeze ACCOUNT`](#gateway-freeze-account)
* [`gateway get-deploy HASH`](#gateway-get-deploy-hash)
* [`gateway help [COMMAND]`](#gateway-help-command)
* [`gateway issue ACCOUNT`](#gateway-issue-account)
* [`gateway refresh ACCOUNT [EXPIRY]`](#gateway-refresh-account-expiry)
* [`gateway revoke ACCOUNT`](#gateway-revoke-account)
* [`gateway revoke-admin ADDRESS`](#gateway-revoke-admin-address)
* [`gateway revoke-gatekeeper ADDRESS`](#gateway-revoke-gatekeeper-address)
* [`gateway unfreeze ACCOUNT`](#gateway-unfreeze-account)
* [`gateway verify ACCOUNT`](#gateway-verify-account)

## `gateway add-admin ADDRESS`

Add an admin to a contract

```
USAGE
  $ gateway add-admin ADDRESS

ARGUMENTS
  ADDRESS  The address of the admin to add to the contract

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway add-admin tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/add-admin.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/add-admin.ts)_

## `gateway add-gatekeeper ADDRESS`

Add a gatekeeper to a network

```
USAGE
  $ gateway add-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to add to the network

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway add-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/add-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/add-gatekeeper.ts)_

## `gateway freeze ACCOUNT`

Freeze a gateway token

```
USAGE
  $ gateway freeze ACCOUNT

ARGUMENTS
  ACCOUNT  The account holding the KYC Token

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Frozen
```

_See code: [dist/commands/freeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/freeze.ts)_

## `gateway get-deploy HASH`

Check status of deployment

```
USAGE
  $ gateway get-deploy HASH

ARGUMENTS
  HASH  Deployment hash

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway get-deploy EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Frozen
```

_See code: [dist/commands/get-deploy.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/get-deploy.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

## `gateway issue ACCOUNT`

Issue a gateway token to a wallet

```
USAGE
  $ gateway issue ACCOUNT

ARGUMENTS
  ACCOUNT  The account to issue the KYC Token to

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/issue.ts)_

## `gateway refresh ACCOUNT [EXPIRY]`

Refresh a gateway token

```
USAGE
  $ gateway refresh ACCOUNT [EXPIRY]

ARGUMENTS
  ACCOUNT  The account to issue the KYC Token to
  EXPIRY   [default: 54000] The new expiry time in seconds for the gateway token (default 15 minutes)

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway refresh EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv 54000
  Refreshed
```

_See code: [dist/commands/refresh.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/refresh.ts)_

## `gateway revoke ACCOUNT`

Revoke a gateway token

```
USAGE
  $ gateway revoke ACCOUNT

ARGUMENTS
  ACCOUNT  The account holding the KYC Token

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/revoke.ts)_

## `gateway revoke-admin ADDRESS`

Revoke an admin

```
USAGE
  $ gateway revoke-admin ADDRESS

ARGUMENTS
  ADDRESS  The address of the admin to revoke

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway add-admin tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/revoke-admin.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/revoke-admin.ts)_

## `gateway revoke-gatekeeper ADDRESS`

Revoke a gatekeeper from a network

```
USAGE
  $ gateway revoke-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to remove from the network

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

_See code: [dist/commands/revoke-gatekeeper.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/revoke-gatekeeper.ts)_

## `gateway unfreeze ACCOUNT`

Unfreeze a gateway token

```
USAGE
  $ gateway unfreeze ACCOUNT

ARGUMENTS
  ACCOUNT  The account holding the KYC Token

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway unfreeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Unfrozen
```

_See code: [dist/commands/unfreeze.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/unfreeze.ts)_

## `gateway verify ACCOUNT`

Verify a gateway token

```
USAGE
  $ gateway verify ACCOUNT

ARGUMENTS
  ACCOUNT  The account holding the KYC Token

OPTIONS
  -c, --config=config  [default: ./config.json] Configuration file for commands
  -h, --help           show CLI help

EXAMPLE
  $ gateway verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  {
    "issuingGatekeeper": "tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp",
    "gatekeeperNetwork": "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv",
    "owner": "EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv",
    "status": "Active",
    "expiry": 1234567890
  }
```

_See code: [dist/commands/verify.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.1.4/dist/commands/verify.ts)_
<!-- commandsstop -->
