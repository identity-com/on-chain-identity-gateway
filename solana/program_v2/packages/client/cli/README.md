
# Usage

  <!-- usage -->
```sh-session
$ npm install -g @identity.com/gateway-solana-cli
$ gateway COMMAND
running command...
$ gateway (--version)
@identity.com/gateway-solana-cli/2.0.0-beta.13 darwin-arm64 node-v18.12.1
$ gateway --help [COMMAND]
USAGE
  $ gateway COMMAND
...
```
<!-- usagestop -->

# Commands

  <!-- commands -->
* [`gateway gatekeeper`](#gateway-gatekeeper)
* [`gateway gatekeeper close`](#gateway-gatekeeper-close)
* [`gateway gatekeeper create`](#gateway-gatekeeper-create)
* [`gateway gatekeeper setstate`](#gateway-gatekeeper-setstate)
* [`gateway gatekeeper update`](#gateway-gatekeeper-update)
* [`gateway help [COMMANDS]`](#gateway-help-commands)
* [`gateway network`](#gateway-network)
* [`gateway network close`](#gateway-network-close)
* [`gateway network create`](#gateway-network-create)
* [`gateway network update`](#gateway-network-update)
* [`gateway pass`](#gateway-pass)
* [`gateway pass changegatekeeper`](#gateway-pass-changegatekeeper)
* [`gateway pass expire`](#gateway-pass-expire)
* [`gateway pass issue`](#gateway-pass-issue)
* [`gateway pass refresh`](#gateway-pass-refresh)
* [`gateway pass setdata`](#gateway-pass-setdata)
* [`gateway pass setstate`](#gateway-pass-setstate)
* [`gateway pass verify`](#gateway-pass-verify)
* [`gateway plugins`](#gateway-plugins)
* [`gateway plugins:install PLUGIN...`](#gateway-pluginsinstall-plugin)
* [`gateway plugins:inspect PLUGIN...`](#gateway-pluginsinspect-plugin)
* [`gateway plugins:install PLUGIN...`](#gateway-pluginsinstall-plugin-1)
* [`gateway plugins:link PLUGIN`](#gateway-pluginslink-plugin)
* [`gateway plugins:uninstall PLUGIN...`](#gateway-pluginsuninstall-plugin)
* [`gateway plugins:uninstall PLUGIN...`](#gateway-pluginsuninstall-plugin-1)
* [`gateway plugins:uninstall PLUGIN...`](#gateway-pluginsuninstall-plugin-2)
* [`gateway plugins update`](#gateway-plugins-update)

## `gateway gatekeeper`

Controls a gatekeeper on a network

```
USAGE
  $ gateway gatekeeper

DESCRIPTION
  Controls a gatekeeper on a network
```

_See code: [dist/commands/gatekeeper/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.13/dist/commands/gatekeeper/index.ts)_

## `gateway gatekeeper close`

Closes an existing gatekeeper

```
USAGE
  $ gateway gatekeeper close -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address

DESCRIPTION
  Closes an existing gatekeeper

EXAMPLES
  $ gateway gatekeeper close --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway gatekeeper create`

Creates a gatekeeper on an existing network

```
USAGE
  $ gateway gatekeeper create -n <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The cluster you wish to use
  -h, --help             Show CLI help.
  -k, --keypair=<value>  (required) Path to a solana keypair
  -n, --network=<value>  (required) String representing the network's address

DESCRIPTION
  Creates a gatekeeper on an existing network

EXAMPLES
  $ gateway gatekeeper create --network [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway gatekeeper setstate`

Set the states of a gatekeeper on an existing network

```
USAGE
  $ gateway gatekeeper setstate -g <value> -s <value> -n <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the address of the network
  -s, --state=<value>       (required) Desired state of the gatekeeper (0 = Active, 1 = Frozen, 2 = Halted)

DESCRIPTION
  Set the states of a gatekeeper on an existing network

EXAMPLES
  $ gateway gatekeeper setState --network [address] --state [target state] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway gatekeeper update`

Updates a gatekeeper on an existing network

```
USAGE
  $ gateway gatekeeper update -n <value> -g <value> -d <value> -f <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The type of cluster
  -d, --data=<value>        (required) Path to a JSON data file representing the new state of the network
  -f, --funder=<value>      (required) Path to a solana keypair
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -n, --network=<value>     (required) String representing the network's address

DESCRIPTION
  Updates a gatekeeper on an existing network

EXAMPLES
  $ gateway gatekeeper update --gatekeeper [address] --data [PATH to JSON data file]
```

## `gateway help [COMMANDS]`

Display help for gateway.

```
USAGE
  $ gateway help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for gateway.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.2/src/commands/help.ts)_

## `gateway network`

Controls a gatekeeper network

```
USAGE
  $ gateway network

DESCRIPTION
  Controls a gatekeeper network
```

_See code: [dist/commands/network/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.13/dist/commands/network/index.ts)_

## `gateway network close`

Closes a gatekeeper network

```
USAGE
  $ gateway network close -n <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The type of cluster
  -h, --help             Show CLI help.
  -k, --keypair=<value>  (required) Path to a Solana keypair
  -n, --network=<value>  (required) The network id

DESCRIPTION
  Closes a gatekeeper network

EXAMPLES
  $ gateway network close --network [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway network create`

Creates a gatekeeper network

```
USAGE
  $ gateway network create -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The cluster you wish to use
  -h, --help             Show CLI help.
  -k, --keypair=<value>  (required) Path to a Solana keypair

DESCRIPTION
  Creates a gatekeeper network

EXAMPLES
  $ gateway network create --keypair [path to keypair] --index [network index] --cluster [cluster type]
```

## `gateway network update`

Updates a gatekeeper network

```
USAGE
  $ gateway network update -n <value> -d <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The type of cluster
  -d, --data=<value>     (required) Path to a JSON data file representing the new state of the network
  -h, --help             Show CLI help.
  -k, --keypair=<value>  (required) Path to Solana keypair
  -n, --network=<value>  (required) The network id

DESCRIPTION
  Updates a gatekeeper network

EXAMPLES
  $ gateway network update --network [address] --data [path to JSON update data] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass`

Controls the gateway pass interface

```
USAGE
  $ gateway pass

DESCRIPTION
  Controls the gateway pass interface
```

_See code: [dist/commands/pass/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.13/dist/commands/pass/index.ts)_

## `gateway pass changegatekeeper`

Changes a pass's assigned gatekeeper

```
USAGE
  $ gateway pass changegatekeeper -s <value> -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the new gatekeeper address to which the pass will be assigned
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) Public Key representing the network's address
  -s, --subject=<value>     (required) Public Key to which a pass shall be issued

DESCRIPTION
  Changes a pass's assigned gatekeeper

EXAMPLES
  $ gateway pass changegatekeeper --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass expire`

Expires a gateway pass

```
USAGE
  $ gateway pass expire -s <value> -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --subject=<value>     (required) Pubkey to which a pass shall be issued

DESCRIPTION
  Expires a gateway pass

EXAMPLES
  $ gateway pass expire --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass issue`

Issues a gateway pass

```
USAGE
  $ gateway pass issue -s <value> -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --subject=<value>     (required) Pubkey to which a pass shall be issued

DESCRIPTION
  Issues a gateway pass

EXAMPLES
  $ gateway pass issue --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass refresh`

Refreshes a gateway pass

```
USAGE
  $ gateway pass refresh -s <value> -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --subject=<value>     (required) Pubkey to which a pass shall be issued

DESCRIPTION
  Refreshes a gateway pass

EXAMPLES
  $ gateway pass refresh --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass setdata`

Sets the data for a gateway pass

```
USAGE
  $ gateway pass setdata -s <value> -n <value> -g <value> --data <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --subject=<value>     (required) Address to which a pass shall be issued
  --data=<value>            (required) Path to new pass and network data

DESCRIPTION
  Sets the data for a gateway pass

EXAMPLES
  $ gateway pass setdata --subject [address] --network [address] --gatekeeper [address] --data [path to data] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass setstate`

Sets the state of a gateway pass

```
USAGE
  $ gateway pass setstate -S <value> -n <value> -g <value> -k <value> -s <value> -c <value> [-h]

FLAGS
  -S, --subject=<value>     (required) Pubkey to which a pass shall be issued
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --state=<value>       (required) The target pass state (0 = Active, 1 = Frozen, 2 = Revoked)

DESCRIPTION
  Sets the state of a gateway pass

EXAMPLES
  $ gateway pass setstate --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass verify`

Verifies a gateway pass

```
USAGE
  $ gateway pass verify -s <value> -n <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The cluster you wish to use
  -h, --help             Show CLI help.
  -n, --network=<value>  (required) String representing the network's address
  -s, --subject=<value>  (required) The address to check for a gateway pass

DESCRIPTION
  Verifies a gateway pass

EXAMPLES
  $ gateway pass verify --subject [address] --network [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway plugins`

List installed plugins.

```
USAGE
  $ gateway plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ gateway plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.0/src/commands/plugins/index.ts)_

## `gateway plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gateway plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ gateway plugins add

EXAMPLES
  $ gateway plugins:install myplugin 

  $ gateway plugins:install https://github.com/someuser/someplugin

  $ gateway plugins:install someuser/someplugin
```

## `gateway plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ gateway plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ gateway plugins:inspect myplugin
```

## `gateway plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gateway plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ gateway plugins add

EXAMPLES
  $ gateway plugins:install myplugin 

  $ gateway plugins:install https://github.com/someuser/someplugin

  $ gateway plugins:install someuser/someplugin
```

## `gateway plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ gateway plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ gateway plugins:link myplugin
```

## `gateway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway plugins unlink
  $ gateway plugins remove
```

## `gateway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway plugins unlink
  $ gateway plugins remove
```

## `gateway plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway plugins unlink
  $ gateway plugins remove
```

## `gateway plugins update`

Update installed plugins.

```
USAGE
  $ gateway plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
