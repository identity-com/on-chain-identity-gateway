# gatekeeper-cli

CLI to manage OCIV Gateway Tokens

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@identity.com/solana-gatekeeper-cli.svg)](https://npmjs.org/package/@identity.com/solana-gatekeeper-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@identity.com/solana-gatekeeper-cli.svg)](https://npmjs.org/package/@identity.com/solana-gatekeeper-cli)
[![License](https://img.shields.io/npm/l/@identity.com/solana-gatekeeper-cli.svg)](https://github.com/identity-com/on-chain-identity-gateway/blob/main/solana/gatekeeper-cli/package.json)

<!-- toc -->
* [gatekeeper-cli](#gatekeeper-cli)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @identity.com/solana-gatekeeper-cli
$ gateway COMMAND
running command...
$ gateway (-v|--version|version)
@identity.com/solana-gatekeeper-cli/0.0.2 darwin-arm64 node-v18.16.0
$ gateway --help [COMMAND]
USAGE
  $ gateway COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway add-gatekeeper ADDRESS`](#gateway-add-gatekeeper-address)
* [`gateway burn GATEWAYTOKEN`](#gateway-burn-gatewaytoken)
* [`gateway freeze GATEWAYTOKEN`](#gateway-freeze-gatewaytoken)
* [`gateway help [COMMAND]`](#gateway-help-command)
* [`gateway issue ADDRESS`](#gateway-issue-address)
* [`gateway network-feature FEATURE`](#gateway-network-feature-feature)
* [`gateway plugins`](#gateway-plugins)
* [`gateway plugins:inspect PLUGIN...`](#gateway-pluginsinspect-plugin)
* [`gateway plugins:install PLUGIN...`](#gateway-pluginsinstall-plugin)
* [`gateway plugins:link PLUGIN`](#gateway-pluginslink-plugin)
* [`gateway plugins:uninstall PLUGIN...`](#gateway-pluginsuninstall-plugin)
* [`gateway plugins:update`](#gateway-pluginsupdate)
* [`gateway refresh GATEWAYTOKEN [EXPIRY]`](#gateway-refresh-gatewaytoken-expiry)
* [`gateway revoke GATEWAYTOKEN`](#gateway-revoke-gatewaytoken)
* [`gateway revoke-gatekeeper ADDRESS`](#gateway-revoke-gatekeeper-address)
* [`gateway unfreeze GATEWAYTOKEN`](#gateway-unfreeze-gatewaytoken)
* [`gateway verify OWNER`](#gateway-verify-owner)
* [`gateway version`](#gateway-version)

## `gateway add-gatekeeper ADDRESS`

Add a gatekeeper to a network

```
USAGE
  $ gateway add-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to add to the network

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The private key file for the
                                                               gatekeeper authority

EXAMPLE
  $ gateway add-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

## `gateway burn GATEWAYTOKEN`

Burns a gateway token

```
USAGE
  $ gateway burn GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to burn

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway burn EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

## `gateway freeze GATEWAYTOKEN`

Freeze a gateway token

```
USAGE
  $ gateway freeze GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to freeze

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway freeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Frozen
```

## `gateway help [COMMAND]`

Display help for gateway.

```
USAGE
  $ gateway help [COMMAND]

ARGUMENTS
  COMMAND  Command to show help for.

OPTIONS
  -n, --nested-commands  Include all nested commands in the output.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.19/src/commands/help.ts)_

## `gateway issue ADDRESS`

Issue a gateway token to a wallet

```
USAGE
  $ gateway issue ADDRESS

ARGUMENTS
  ADDRESS  The address to issue the token to

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -e, --expiry=expiry                                          The expiry time in seconds for the gateway token (default
                                                               none)

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway issue EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv2QJjjrzdPSrcZUuAH2KrEU61crWz49KnSLSzwjDUnLSV
```

## `gateway network-feature FEATURE`

Get or Change a Network Feature

```
USAGE
  $ gateway network-feature FEATURE

ARGUMENTS
  FEATURE  The Network Feature Name

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -o, --featureOperation=add|remove|get                        [default: get] add, remove, or get a network feature

EXAMPLE
  $ gateway network-feature userTokenExpiry
```

## `gateway plugins`

List installed plugins.

```
USAGE
  $ gateway plugins

OPTIONS
  --core  Show core plugins.

EXAMPLE
  $ gateway plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/index.ts)_

## `gateway plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ gateway plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

EXAMPLE
  $ gateway plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/inspect.ts)_

## `gateway plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gateway plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

OPTIONS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command 
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in 
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ gateway plugins:add

EXAMPLES
  $ gateway plugins:install myplugin 
  $ gateway plugins:install https://github.com/someuser/someplugin
  $ gateway plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/install.ts)_

## `gateway plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ gateway plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
   command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLE
  $ gateway plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/link.ts)_

## `gateway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose

ALIASES
  $ gateway plugins:unlink
  $ gateway plugins:remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/uninstall.ts)_

## `gateway plugins:update`

Update installed plugins.

```
USAGE
  $ gateway plugins:update

OPTIONS
  -h, --help     Show CLI help.
  -v, --verbose
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.7/src/commands/plugins/update.ts)_

## `gateway refresh GATEWAYTOKEN [EXPIRY]`

Refresh a gateway token

```
USAGE
  $ gateway refresh GATEWAYTOKEN [EXPIRY]

ARGUMENTS
  GATEWAYTOKEN  The gateway token to freeze
  EXPIRY        [default: 54000] The new expiry time in seconds for the gateway token (default 15 minutes)

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway refresh EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv 54000
  Refreshed
```

## `gateway revoke GATEWAYTOKEN`

Revoke a gateway token

```
USAGE
  $ gateway revoke GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to revoke

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway revoke EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Revoked
```

## `gateway revoke-gatekeeper ADDRESS`

Revoke a gatekeeper from a network

```
USAGE
  $ gateway revoke-gatekeeper ADDRESS

ARGUMENTS
  ADDRESS  The address of the gatekeeper to revoke from the network

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The private key file for the
                                                               gatekeeper authority

EXAMPLE
  $ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
```

## `gateway unfreeze GATEWAYTOKEN`

Unfreeze a gateway token

```
USAGE
  $ gateway unfreeze GATEWAYTOKEN

ARGUMENTS
  GATEWAYTOKEN  The gateway token to unfreeze

OPTIONS
  -a, --airdrop                                                Airdrop SOL if needed

  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -g, --gatekeeperKey=gatekeeperKey                            [default: [object Object]] The private key file for the
                                                               gatekeeper authority

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

EXAMPLE
  $ gateway unfreeze EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
  Unfrozen
```

## `gateway verify OWNER`

Verify a gateway token

```
USAGE
  $ gateway verify OWNER

ARGUMENTS
  OWNER  The gateway token to revoke

OPTIONS
  -c, --cluster=mainnet-beta|testnet|devnet|civicnet|localnet  [default: mainnet-beta] The cluster to target.
                                                               Alternatively, set the environment variable
                                                               SOLANA_CLUSTER. To override this property with a specific
                                                               endpoint url, set SOLANA_CLUSTER_URL

  -h, --help                                                   Show CLI help.

  -n, --gatekeeperNetworkKey=gatekeeperNetworkKey              [default: [object Object]] The public key (in base 58) of
                                                               the gatekeeper network that the gatekeeper belongs to.

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

## `gateway version`

```
USAGE
  $ gateway version

OPTIONS
  --json     Format output as json.

  --verbose  Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI
             is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v1.1.3/src/commands/version.ts)_
<!-- commandsstop -->
Note - if you are looking for the CLI tool,
it has been moved to [@identity.com/solana-gatekeeper-cli](https://www.npmjs.com/package/@identity.com/solana-gatekeeper-cli)
