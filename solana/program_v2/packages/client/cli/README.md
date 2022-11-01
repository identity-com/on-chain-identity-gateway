
# Usage

  <!-- usage -->
```sh-session
$ npm install -g @identity.com/gateway-solana-cli
$ gateway (--version)
@identity.com/gateway-solana-cli/2.0.0-beta.5 darwin-arm64 node-v17.8.0
$ gateway --help [COMMAND]
USAGE
  $ gateway [SUBFIELD] [COMMAND]
...
```
<!-- usagestop -->

# Commands

  <!-- commands -->
* [`gateway gatekeeper`](#gateway-gatekeeper)
* [`gateway gatekeeper close`](#gateway-gatekeeper-close)
* [`gateway gatekeeper create`](#gateway-gatekeeper-create)
* [`gateway gatekeeper inspect`](#gateway-gatekeeper-inspect)
* [`gateway gatekeeper setstate`](#gateway-gatekeeper-setstate)
* [`gateway gatekeeper update`](#gateway-gatekeeper-update)
* [`gateway help [COMMAND]`](#gateway-help-command)
* [`gateway network`](#gateway-network)
* [`gateway network close`](#gateway-network-close)
* [`gateway network create`](#gateway-network-create)
* [`gateway network inspect`](#gateway-network-inspect)
* [`gateway network update`](#gateway-network-update)
* [`gateway pass`](#gateway-pass)
* [`gateway pass changegatekeeper`](#gateway-pass-changegatekeeper)
* [`gateway pass expire`](#gateway-pass-expire)
* [`gateway pass inspect`](#gateway-pass-inspect)
* [`gateway pass issue`](#gateway-pass-issue)
* [`gateway pass refresh`](#gateway-pass-refresh)
* [`gateway pass setdata`](#gateway-pass-setdata)
* [`gateway pass setstate`](#gateway-pass-setstate)
* [`gateway pass verify`](#gateway-pass-verify)

## `gateway gatekeeper`

Controls a gatekeeper on a network

```md
USAGE
  $ gateway gatekeeper [COMMAND]

DESCRIPTION
  Controls a gatekeeper on a network
```

_See code: [dist/commands/gatekeeper/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.5/dist/commands/gatekeeper/index.ts)_

## `gateway gatekeeper close`

Closes an existing gatekeeper

```md
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

```md
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

## `gateway gatekeeper inspect`

Inspects a gatekeeper

```md
USAGE
  $ gateway gatekeeper inspect -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address

DESCRIPTION
  Inspects a gatekeeper

EXAMPLES
  $ gateway gatekeeper close --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway gatekeeper setstate`

Set the states of a gatekeeper on an existing network

```md
USAGE
  $ gateway gatekeeper setstate -g <value> -s <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -s, --state=<value>       (required) Desired state of the gatekeeper (0 = Active, 1 = Frozen, 2 = Halted)

DESCRIPTION
  Set the states of a gatekeeper on an existing network

EXAMPLES
  $ gateway gatekeeper setState --network [address] --state [target state] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway gatekeeper update`

Updates a gatekeeper on an existing network

```md
USAGE
  $ gateway gatekeeper update -n <value> -g <value> -d <value> -s <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The type of cluster
  -d, --data=<value>        (required) Path to a JSON data file representing the new state of the network
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --stake=<value>       (required) String representing the gatekeeper's staking account

DESCRIPTION
  Updates a gatekeeper on an existing network

EXAMPLES
  $ gateway gatekeeper update ---network [address] --gatekeeper [address] --data [path to JSON file] --stake [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway help [COMMAND]`

Display help for gateway.

```md
USAGE
  $ gateway help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for gateway.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.16/src/commands/help.ts)_

## `gateway network`

Controls a gatekeeper network

```md
USAGE
  $ gateway network [COMMAND]

DESCRIPTION
  Controls a gatekeeper network
```

_See code: [dist/commands/network/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.5/dist/commands/network/index.ts)_

## `gateway network close`

Closes a gatekeeper network

```md
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

```md
USAGE
  $ gateway network create -k <value> -c <value> -i <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The cluster you wish to use
  -h, --help             Show CLI help.
  -i, --index=<value>    (required) The index of the network to create
  -k, --keypair=<value>  (required) Path to a Solana keypair

DESCRIPTION
  Creates a gatekeeper network

EXAMPLES
  $ gateway network create --keypair [path to keypair] --index [network index] --cluster [cluster type]
```

## `gateway network inspect`

Inspects a gatekeeper network

```md
USAGE
  $ gateway network inspect -n <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>  (required) The type of cluster
  -h, --help             Show CLI help.
  -k, --keypair=<value>  (required) Path to a Solana keypair
  -n, --network=<value>  (required) The network id

DESCRIPTION
  Inspects a gatekeeper network

EXAMPLES
  $ gateway network close --network [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway network update`

Updates a gatekeeper network

```md
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

```md
USAGE
  $ gateway pass [COMMAND]

DESCRIPTION
  Controls the gateway pass interface
```

_See code: [dist/commands/pass/index.ts](https://github.com/identity-com/on-chain-identity-gateway/blob/v2.0.0-beta.5/dist/commands/pass/index.ts)_

## `gateway pass changegatekeeper`

Changes a pass's assigned gatekeeper

```md
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

```md
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

## `gateway pass inspect`

Inspects a gateway pass

```md
USAGE
  $ gateway pass inspect -s <value> -n <value> -g <value> -k <value> -c <value> [-h]

FLAGS
  -c, --cluster=<value>     (required) The cluster you wish to use
  -g, --gatekeeper=<value>  (required) String representing the gatekeeper's address
  -h, --help                Show CLI help.
  -k, --keypair=<value>     (required) Path to a solana keypair
  -n, --network=<value>     (required) String representing the network's address
  -s, --subject=<value>     (required) Pubkey to which a pass shall be issued

DESCRIPTION
  Inspects a gateway pass

EXAMPLES
  $ gateway pass refresh --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
```

## `gateway pass issue`

Issues a gateway pass

```md
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

```md
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

```md
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

```md
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

```md
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

<!-- commandsstop -->
