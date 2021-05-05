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
$ npm install -g @identity.com/gatekeeper-lib
$ ociv COMMAND
running command...
$ ociv (-v|--version|version)
@identity.com/gatekeeper-lib/1.0.2 darwin-x64 node-v16.0.0
$ ociv --help [COMMAND]
USAGE
  $ ociv COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`ociv audit GATEWAYTOKEN`](#ociv-audit-gatewaytoken)
* [`ociv help [COMMAND]`](#ociv-help-command)
* [`ociv issue ADDRESS`](#ociv-issue-address)
* [`ociv revoke GATEWAYTOKEN`](#ociv-revoke-gatewaytoken)
* [`ociv verify GATEWAYTOKEN`](#ociv-verify-gatewaytoken)

## `ociv audit GATEWAYTOKEN`

Auditing a gateway token

```
USAGE
  $ ociv audit GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token account to verify

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

_See code: [dist/commands/audit.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.2/dist/commands/audit.ts)_

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

## `ociv issue ADDRESS`

Issue a gateway token

```
USAGE
  $ ociv issue ADDRESS

ARGUMENTS
  ADDRESS  The address to issue the token to

OPTIONS
  -h, --help       show CLI help
  -i, --ip=ip
  -n, --name=name

EXAMPLE
  $ ociv issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
```

_See code: [dist/commands/issue.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.2/dist/commands/issue.ts)_

## `ociv revoke GATEWAYTOKEN`

Revoke a gateway token

```
USAGE
  $ ociv revoke GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to revoke

OPTIONS
  -h, --help  show CLI help

EXAMPLE
  $ ociv revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

_See code: [dist/commands/revoke.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.2/dist/commands/revoke.ts)_

## `ociv verify GATEWAYTOKEN`

Verify a gateway token

```
USAGE
  $ ociv verify GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token account to verify

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

_See code: [dist/commands/verify.ts](https://github.com/identity-com/gatekeeper-lib/blob/v1.0.2/dist/commands/verify.ts)_
<!-- commandsstop -->
