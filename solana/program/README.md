# Solana Gateway

The Gateway Protocol is a protocol that allows a Solana program to restrict access
to holders of a valid Gateway Token.

* [Functional Details](#functional-details)
* [Integration](#integration)
* [Getting Started](#getting-started)
* [Technical Details](#technical-details)

## Functional Details

A Gateway Token is an on-chain, non-transferrable token that dApps can issue,
freeze, or revoke for user access control.

The presence of an active gateway token proves that a user's wallet was verified according to a dApp's requirements.

The dApp can verify the state of a wallet's gateway token before allowing transactions through,
thus blocking non-compliant users.

Gateway tokens are issued by Gatekeepers. A gatekeeper may be a single dApp, an organisation that performs KYC,
or a third-party that obtains KYC information from a user and issues a gateway token on their behalf.

A cluster of gatekeepers with similar rules for issuing gateway tokens are defined as a Gatekeeper Network.
A gatekeeper network is identified by a public key. This key (which may be owned by a DAO or multisig)
has the power to add and remove gatekeepers from the network.

In general, a user's wallet can be associated with multiple gateway tokens (1:N),
however, a token is only ever issued for a single specific Gatekeeper Network (1:1).

Creating a gatekeeper network is a permissionless process, however, gatekeepers must be added to the network by the network authority.

This program defines the operations that gatekeepers can perform on the Solana blockchain,
such as issuing and revoking gateway tokens, as well as operations to add/remove gatekeepers,
performed by gatekeeper network authorities.

## Integration

This section describes how to integrate the gateway protocol into your program.

Follow these steps if you want to use the gateway protocol to restrict access to your program based on gateway tokens.

Integrating programs choose a gatekeeper network to trust, by adding its public key to a program account.

This library then validates that gateway tokens are issued by gatekeepers in this network and are valid.

To integrate Solana Gateway with your program:

In Cargo.toml
```toml
solana-gateway = "<LATEST VERSION>"
```

In the instruction processor (typically processor.rs)

```rust
use solana_gateway::Gateway;
use solana_program::{
    account_info::AccountInfo,
    program_pack::Pack,
    pubkey::Pubkey,
};

fn process() {
    // The owner of the gateway token
    let owner: AccountInfo;
    // The gateway token presented by the owner
    let gateway_token_account_info: AccountInfo;
    // The gatekeeper network key
    let gatekeeper_network: Pubkey;

    let gateway_verification_result:Result<(), GatewayError> =
        Gateway::verify_gateway_token_account_info(
            &gateway_token_account_info, &owner.key, &gatekeeper_network, None
        );
}
```

### Advanced Usage

By default, the verify function will fail if the token has expired. This is an important security measure
in some gatekeeper networks, particularly ones that require ongoing monitoring of the token's owner.

In gatekeeper networks where this is not relevant, it is recommended to issue tokens without expiry.

However, in some scenarios, an expired token may still be considered valid. Alternatively the integrator
may wish to set a tolerance value.

To ignore expiry:

```rust
let gateway_verification_result:Result<(), GatewayError> =
        Gateway::verify_gateway_token_account_info(
            &gateway_token_account_info, &owner.key, &gatekeeper_network, {
                Some(VerificationOptions {
                    check_expiry: false,
                    ..Default::default()
                },
            }
        );
```

To set a tolerance:

```rust
let gateway_verification_result:Result<(), GatewayError> =
        Gateway::verify_gateway_token_account_info(
            &gateway_token_account_info, &owner.key, &gatekeeper_network, {
                Some(VerificationOptions {
                    check_expiry: true,
                    expiry_tolerance_seconds: Some(120),    // allow 2 minutes tolerance for token expiry
                },
            }
        );
```

## Getting Started

Prerequisites for building the program:

1. Rust

```shell
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Solana 

```shell
$ sh -c "$(curl -sSfL https://release.solana.com/v1.16.17/install)"
```

To build the program:

```shell
$ cargo build-spf
```

To run the tests:

```shell
# unit tests
$ cargo test
# functional tests
$ cargo test-sbf
```

To deploy to a local environment:

```shell
$ cargo build-spf
$ solana-test-validator --bpf-program gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs target/deploy/solana_gateway.so
```

## Technical Details

### Instructions

The program provides the following instructions:

#### AddGatekeeper

Add a new Gatekeeper to a network.

Accounts expected by this instruction:

1. `[writable, signer]`    funder_account: the payer of the transaction
2. `[writeable]`           gatekeeper_account: the destination account containing details of the gatekeeper
3. `[]`                    gatekeeper_authority: the authority that owns the gatekeeper account
4. `[signer]`              gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
5. `[]`                    Rent sysvar
6. `[]`                    System program

#### RemoveGatekeeper

Removes a gatekeeper funding the rent back to an address and invalidating their addresses.

Accounts expected by this instruction:

1. `[writable]`            funds_to_account: the account that will receive the rent back
2. `[writable]`            gatekeeper_account: the gatekeeper account to close
3. `[]`                    gatekeeper_authority: the authority that owns the gatekeeper account
4. `[signer]`              gatekeeper_network: the gatekeeper network to which the gatekeeper belongs

#### Issue

Issue a new gateway token.

Accounts expected by this instruction:

1. `[writable, signer]`    funder_account: the payer of the transaction
2. `[writable]`            gateway_token: the destination account of the gateway token
3. `[]`                    owner: the wallet that the gateway token is issued for
4. `[]`                    gatekeeper_account: the account containing details of the gatekeeper issuing the gateway token
5. `[signer]`              gatekeeper_authority: the authority that owns the gatekeeper account
6. `[]`                    gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
7. `[]`                    Rent sysvar
8. `[]`                    System program

Fields:

- `seed: Option<AddressSeed>`: An optional seed to use when generating a gateway token allowing multiple gateway tokens per wallet
- `expire_time: Option<UnixTimestamp>`: An optional unix timestamp at which point the issued token is no longer valid

#### SetState

Update the gateway token state (Revoke, freeze or unfreeze).

Gatekeepers may freeze or unfreeze any gateway tokens issued by them.
Additionally, any gatekeeper may revoke tokens in the same gatekeeper network.

Accounts expected by this instruction:

1. `[writable]`            gateway_token: the destination account of the gateway token
2. `[signer]`              gatekeeper_authority: the gatekeeper authority that is making the change
3. `[]`                    gatekeeper_account: the account containing details of the gatekeeper

Fields:

- `state: GatewayTokenState`: The new state of the gateway token

#### UpdateExpiry

Update the gateway token expiry time.

Accounts expected by this instruction:

1. `[writable]`            gateway_token: the destination account of the gateway token
2. `[signer]`              gatekeeper_authority: the gatekeeper authority that is making the change
3. `[]`                    gatekeeper_account: the account containing details of the gatekeeper

Fields:

- `expire_time: UnixTimestamp`: The new expiry time of the gateway token

#### AddFeatureToNetwork

Add a new feature to a gatekeeper network. An example feature is "UserTokenExpiry" (see below).

The presence of a feature in a gatekeeper network is indicated by the presence of a PDA with a known address derivable from the gatekeeper network address and the feature name.

Accounts expected by this instruction:

1. `[signer, writable]` funder_account: The account funding this transaction
2. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
3. `[writable]`         feature_account: The new feature account
4. `[]`                 system_program: The system program

Fields:

- `feature: NetworkFeature`: The network feature to add

#### RemoveFeatureFromNetwork

Remove a feature from a gatekeeper network.

Accounts expected by this instruction:

1. `[signer, writable]` funds_to_account: The account receiving the funds
2. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
3. `[writable]`         feature_account: The new feature account

Fields:

- `feature: NetworkFeature`: The network feature to remove

#### ExpireToken

Expire a gateway token in a gatekeeper network with the UserTokenExpiry feature. This instruction is signed by the owner, usually as a CPI from a separate program that is gated by the gateway protocol.

The gatekeeper network must have the UserTokenExpiry feature enabled, indicated by the presence of a PDA with a known address derivable from the gatekeeper network address and the feature name.

Accounts expected by this instruction:

1. `[writable]`    gateway_token: The token to expire
2. `[signer]`      owner: The wallet that the gateway token is for
3. `[]`            network_expire_feature: The UserTokenExpiry feature account for the gatekeeper network

Fields:

- `padding: Option<AddressSeed>`: Padding for backwards compatibility
- `gatekeeper_network: Pubkey`: The gatekeeper network

#### BurnToken

Remove a gateway token from the system, closing the account. Unlike revoking a gateway token, this does not leave an open account on chain, and can be reversed by reissuing the token.

Accounts expected by this instruction:

1. `[writable]`            gateway_token: the account of the gateway token
2. `[signer]`              gatekeeper_authority: the gatekeeper authority that is burning the token
3. `[]`                    gatekeeper_account: the gatekeeper account linking the gatekeeper authority to the gatekeeper network
4. `[writeable]`           recipient: the recipient of the lamports in the gateway token account

### Account Structures

#### Gateway Token

Defines the gateway token structure.

- `version: u8`: Version field for backwards compatibility - currently 0.
- `parent_gateway_token: Option<Pubkey>`: If the token is a session token, this is set to the parent token that was used to generate it. Note: Deprecated - This is kept to maintain backward compatibility, but is not used.
- `owner_wallet: Pubkey`: The public key of the wallet to which this token was assigned.
- `owner_identity: Option<Pubkey>`: The DID (must be on Solana) of the identity to which the token was assigned. Note: Deprecated - This is kept to maintain backward compatibility, but is not used.
- `gatekeeper_network: Pubkey`: The gateway network that issued the token.
- `issuing_gatekeeper: Pubkey`: The specific gatekeeper that issued the token.
- `state: GatewayTokenState`: The current token state.
- `expire_time: Option<UnixTimestamp>`: The expiry time of the token (unix timestamp) (expirable tokens only).

#### Features

Features are properties of a gatekeeper network that can be enabled or disabled.

They are represented by a PDA with a known address derivable from the gatekeeper network address and the feature name.

Currently only one feature is supported: UserTokenExpiry.

The UserTokenExpiry feature allows users to set an expiry time on their own gateway tokens.

A use-case for this feature is a smart contract that checks and then expires a gateway token.

This allows for "single-use" gateway tokens, e.g. for token sales or airdrops, which need to be
re-activated after use.

Note, all gateway tokens may have an expire time set by the gatekeeper, whether a network supports UserTokenExpiry
or not.

#### Gateway Token State

Tokens can be in the following states:
- Active
- Revoked
- Frozen

Only tokens in the "active" state are accepted by programs.

Tokens in the "revoked" state are invalid, and programs should take steps to remove any
open positions, orders etc that were issued with tokens that were later revoked
(see [below](#pruning-revoked-tokens) for more details).

Revoked tokens cannot be reactivated but must be reissued.

Tokens that are frozen are "paused" and new transactions should not
accept them. They may be frozen for a number of reasons, for example if
a user attempts to use a token while in a restricted jurisdiction, the
gatekeeper may freeze the token temporarily. Frozen/Unfrozen tokens can
be unfrozen by the issuing gatekeeper.

While not represented by a state on-chain, tokens may also have 'expired', in which
case, they are treated as frozen.
