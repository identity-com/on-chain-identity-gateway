# Solana Gateway Integration Library

A Rust crate that can be used by a Solana program to restrict access to holders of a valid Gateway Token.

Gateway tokens are issued by gatekeepers. A cluster of gatekeepers with similar rules for
issuing gateway tokens are defined as a Gatekeeper Network.

The on-chain program chooses a gatekeeper network to trust, by adding its public key to a program account.

This library then validates that gateway tokens are issued by gatekeepers in this network and are valid.

## Usage

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
    let gatekeeper: Pubkey;

    let gateway_verification_result:Result<(), GatewayError> =
        Gateway::verify_gateway_token_account_info(
            &gateway_token_account_info, &owner.key, &gatekeeper, None
        );
}
```

## Advanced Usage

By default, the verify function will fail if the token has expired. This is an important security measure
in some gatekeeper networks, particularly ones that require ongoing monitoring of the token's owner.

In gatekeeper networks where this is not relevant, it is recommended to issue tokens without expiry.

However, in some scenarios, an expired token may still be considered valid. Alternatively the integrator
may wish to set a tolerance value.

To ignore expiry:

```rust
let gateway_verification_result:Result<(), GatewayError> =
        Gateway::verify_gateway_token_account_info(
            &gateway_token_account_info, &owner.key, &gatekeeper, {
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
            &gateway_token_account_info, &owner.key, &gatekeeper, {
                Some(VerificationOptions {
                    check_expiry: true,
                    expiry_tolerance_seconds: Some(120),    // allow 2 minutes tolerance for token expiry
                },
            }
        );
```
