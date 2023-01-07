oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g gateway-eth-cli
$ gateway-eth COMMAND
running command...
$ gateway-eth (--version)
gateway-eth-cli/0.0.0 darwin-arm64 node-v16.17.1
$ gateway-eth --help [COMMAND]
USAGE
  $ gateway-eth COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`gateway-eth hello PERSON`](#gateway-eth-hello-person)
* [`gateway-eth hello world`](#gateway-eth-hello-world)
* [`gateway-eth help [COMMAND]`](#gateway-eth-help-command)
* [`gateway-eth plugins`](#gateway-eth-plugins)
* [`gateway-eth plugins:install PLUGIN...`](#gateway-eth-pluginsinstall-plugin)
* [`gateway-eth plugins:inspect PLUGIN...`](#gateway-eth-pluginsinspect-plugin)
* [`gateway-eth plugins:install PLUGIN...`](#gateway-eth-pluginsinstall-plugin-1)
* [`gateway-eth plugins:link PLUGIN`](#gateway-eth-pluginslink-plugin)
* [`gateway-eth plugins:uninstall PLUGIN...`](#gateway-eth-pluginsuninstall-plugin)
* [`gateway-eth plugins:uninstall PLUGIN...`](#gateway-eth-pluginsuninstall-plugin-1)
* [`gateway-eth plugins:uninstall PLUGIN...`](#gateway-eth-pluginsuninstall-plugin-2)
* [`gateway-eth plugins update`](#gateway-eth-plugins-update)

## `gateway-eth hello PERSON`

Say hello

```
USAGE
  $ gateway-eth hello [PERSON] -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v0.0.0/dist/commands/hello/index.ts)_

## `gateway-eth hello world`

Say hello world

```
USAGE
  $ gateway-eth hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ gateway-eth hello world
  hello world! (./src/commands/hello/world.ts)
```

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.20/src/commands/help.ts)_

## `gateway-eth plugins`

List installed plugins.

```
USAGE
  $ gateway-eth plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ gateway-eth plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.1.12/src/commands/plugins/index.ts)_

## `gateway-eth plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gateway-eth plugins:install PLUGIN...

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
  $ gateway-eth plugins add

EXAMPLES
  $ gateway-eth plugins:install myplugin 

  $ gateway-eth plugins:install https://github.com/someuser/someplugin

  $ gateway-eth plugins:install someuser/someplugin
```

## `gateway-eth plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ gateway-eth plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ gateway-eth plugins:inspect myplugin
```

## `gateway-eth plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ gateway-eth plugins:install PLUGIN...

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
  $ gateway-eth plugins add

EXAMPLES
  $ gateway-eth plugins:install myplugin 

  $ gateway-eth plugins:install https://github.com/someuser/someplugin

  $ gateway-eth plugins:install someuser/someplugin
```

## `gateway-eth plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ gateway-eth plugins:link PLUGIN

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
  $ gateway-eth plugins:link myplugin
```

## `gateway-eth plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway-eth plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway-eth plugins unlink
  $ gateway-eth plugins remove
```

## `gateway-eth plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway-eth plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway-eth plugins unlink
  $ gateway-eth plugins remove
```

## `gateway-eth plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ gateway-eth plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ gateway-eth plugins unlink
  $ gateway-eth plugins remove
```

## `gateway-eth plugins update`

Update installed plugins.

```
USAGE
  $ gateway-eth plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
