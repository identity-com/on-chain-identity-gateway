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
$ ociv COMMAND
running command...
$ ociv (-v|--version|version)
@identity.com/solana-gatekeeper-lib/1.0.13 linux-x64 node-v12.14.0
$ ociv --help [COMMAND]
USAGE
  $ ociv COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ociv add-gatekeeper [GATEKEEPERAUTHORITYKEYFILEPATH] [GATEKEEPERNETWORKKEYFILEPATH]`](#ociv-add-gatekeeper-gatekeeperauthoritykeyfilepath-gatekeepernetworkkeyfilepath)
* [`ociv audit GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]`](#ociv-audit-gatewaytoken-gatekeeperauthoritykeyfilepath)
* [`ociv help [COMMAND]`](#ociv-help-command)
* [`ociv issue ADDRESS [GATEKEEPERAUTHORITYKEYFILEPATH]`](#ociv-issue-address-gatekeeperauthoritykeyfilepath)
* [`ociv revoke GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]`](#ociv-revoke-gatewaytoken-gatekeeperauthoritykeyfilepath)
* [`ociv verify GATEWAYTOKEN OWNER`](#ociv-verify-gatewaytoken-owner)

## `ociv add-gatekeeper [GATEKEEPERAUTHORITYKEYFILEPATH] [GATEKEEPERNETWORKKEYFILEPATH]`

Issue a gateway token

```
USAGE
  $ ociv add-gatekeeper [GATEKEEPERAUTHORITYKEYFILEPATH] [GATEKEEPERNETWORKKEYFILEPATH]

ARGUMENTS
  GATEKEEPERAUTHORITYKEYFILEPATH  [default: /home/kevin/.config/solana/id.json] The private key file for the gatekeeper
                                  network authority, defaults to user .config/solana/id.json

  GATEKEEPERNETWORKKEYFILEPATH    [default: /home/kevin/.config/solana/id.json] The private key file for the gatekeeper
                                  network, defaults to user .config/solana/id.json

OPTIONS
  -h, --help       show CLI help
  -i, --ip=ip
  -n, --name=name

EXAMPLE
  $ ociv add-gatekeeper
```

_See code: [dist/commands/add-gatekeeper.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.13/dist/commands/add-gatekeeper.ts)_

## `ociv audit GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]`

Auditing a gateway token

```
USAGE
  $ ociv audit GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]

ARGUMENTS
  GATEWAYTOKEN                    The gateway token account to verify

  GATEKEEPERAUTHORITYKEYFILEPATH  [default: /home/kevin/.config/solana/id.json] The private key file for the gatekeeper
                                  network authority

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ ociv audit EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  {
     gatekeeper: 'CKuXF96Bv2tuzAzs6FSbzmjnvNdbAu1LWXjsCxifGGEm',
     owner: 'Ek6vxQJSwkfBadVRaxstsB8i2vjyRLHwHVWaqA4KgYTB',
     revoked: false
  }
```

_See code: [dist/commands/audit.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.13/dist/commands/audit.ts)_

## `ociv help [COMMAND]`

display help for ociv

```
USAGE
  $ ociv help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_

## `ociv issue ADDRESS [GATEKEEPERAUTHORITYKEYFILEPATH]`

Issue a gateway token

```
USAGE
  $ ociv issue ADDRESS [GATEKEEPERAUTHORITYKEYFILEPATH]

ARGUMENTS
  ADDRESS                         The address to issue the token to

  GATEKEEPERAUTHORITYKEYFILEPATH  [default: /home/kevin/.config/solana/id.json] The private key file for the gatekeeper
                                  network authority

OPTIONS
  -h, --help       show CLI help
  -i, --ip=ip
  -n, --name=name

EXAMPLE
  $ ociv issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.13/dist/commands/issue.ts)_

## `ociv revoke GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]`

Revoke a gateway token

```
USAGE
  $ ociv revoke GATEWAYTOKEN [GATEKEEPERAUTHORITYKEYFILEPATH]

ARGUMENTS
  GATEWAYTOKEN                    The gateway token to revoke

  GATEKEEPERAUTHORITYKEYFILEPATH  [default: /home/kevin/.config/solana/id.json] The private key file for the gatekeeper
                                  network authority

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ ociv revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.13/dist/commands/revoke.ts)_

## `ociv verify GATEWAYTOKEN OWNER`

Verify a gateway token

```
USAGE
  $ ociv verify GATEWAYTOKEN OWNER

ARGUMENTS
  GATEWAYTOKEN  The gateway token account to verify
  OWNER         The expected gateway token owner

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ ociv verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  {
     gatekeeper: 'CKuXF96Bv2tuzAzs6FSbzmjnvNdbAu1LWXjsCxifGGEm',
     owner: 'Ek6vxQJSwkfBadVRaxstsB8i2vjyRLHwHVWaqA4KgYTB',
     revoked: false
  }
```

_See code: [dist/commands/verify.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.13/dist/commands/verify.ts)_
<!-- commandsstop -->
