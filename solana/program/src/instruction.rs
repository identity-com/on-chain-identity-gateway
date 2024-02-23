//! Program instructions

use crate::state::get_expire_address_with_seed;
use crate::Gateway;
use solana_program::clock::UnixTimestamp;
use {
    crate::state::GatewayTokenState,
    crate::state::{
        get_gatekeeper_account_address, get_gateway_token_address_with_seed, AddressSeed,
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program,
    },
};

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
#[repr(u8)]
pub enum GatewayInstruction {
    /// Add a new Gatekeeper to a network
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]`    funder_account: the payer of the transaction
    /// 1. `[writeable]`           gatekeeper_account: the destination account containing details of the gatekeeper
    /// 2. `[]`                    gatekeeper_authority: the authority that owns the gatekeeper account
    /// 3. `[signer]`              gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
    /// 4. `[]`                    Rent sysvar
    /// 5. `[]`                    System program
    AddGatekeeper {},

    /// Issue a new gateway token
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]`    funder_account: the payer of the transaction
    /// 1. `[writable]`            gateway_token: the destination account of the gateway token
    /// 2. `[]`                    owner: the wallet that the gateway token is issued for
    /// 3. `[]`                    gatekeeper_account: the account containing details of the gatekeeper issuing the gateway token
    /// 4. `[signer]`              gatekeeper_authority: the authority that owns the gatekeeper account
    /// 5. `[]`                    gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
    /// 6. `[]`                    Rent sysvar
    /// 7. `[]`                    System program
    Issue {
        /// An optional seed to use when generating a gateway token
        /// allowing multiple gateway tokens per wallet
        seed: Option<AddressSeed>,
        /// An optional unix timestamp at which point the issued token is no longer valid
        expire_time: Option<UnixTimestamp>,
    },

    /// Update the gateway token state
    /// Revoke, freeze or unfreeze
    ///
    /// Gatekeepers may freeze or unfreeze any gateway tokens issued by them.
    /// Additionally, any gatekeeper may revoke tokens in the same gatekeeper network.
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]`            gateway_token: the destination account of the gateway token
    /// 1. `[signer]`              gatekeeper_authority: the gatekeeper authority that is making the change
    /// 2. `[]`                    gatekeeper_account: the account containing details of the gatekeeper
    SetState {
        /// The new state of the gateway token
        state: GatewayTokenState,
    },

    /// Update the gateway token expiry time
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]`            gateway_token: the destination account of the gateway token
    /// 1. `[signer]`              gatekeeper_authority: the gatekeeper authority that is making the change
    /// 2. `[]`                    gatekeeper_account: the account containing details of the gatekeeper
    UpdateExpiry {
        ///  the new expiry time of the gateway token
        expire_time: UnixTimestamp,
    },

    /// Removes a gatekeeper funding the rent back to an address and invalidating their addresses
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]`            funds_to_account: the account that will receive the rent back
    /// 1. `[writable]`            gatekeeper_account: the gatekeeper account to close
    /// 2. `[]`                    gatekeeper_authority: the authority that owns the gatekeeper account
    /// 3. `[signer]`              gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
    RemoveGatekeeper,

    /// Add a new feature to a gatekeeper network
    ///
    /// The presence of a feature in a gatekeeper network is indicated by the presence of a PDA with a known
    /// address derivable from the gatekeeper network address and the feature name.
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[signer, writable]` funder_account: The account funding this transaction
    /// 1. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
    /// 2. `[writable]`         feature_account: The new feature account
    /// 3. `[]`                 system_program: The system program
    AddFeatureToNetwork { feature: NetworkFeature },

    /// Remove a feature from a gatekeeper network
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[signer, writable]` funds_to_account: The account receiving the funds
    /// 1. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
    /// 2. `[writable]`         feature_account: The new feature account
    RemoveFeatureFromNetwork { feature: NetworkFeature },

    /// Expire a gateway token in a gatekeeper network with the UserTokenExpiry feature
    ///
    /// This instruction is signed by the owner, usually as a CPI from a separate program that
    /// is gated by the gateway protocol.
    ///
    /// The gatekeeper network must have the UserTokenExpiry feature enabled, indicated by the presence
    /// of a PDA with a known address derivable from the gatekeeper network address and the feature name.
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]`    gateway_token: The token to expire
    /// 1. `[signer]`      owner: The wallet that the gateway token is for
    /// 2. `[]`            network_expire_feature: The UserTokenExpiry feature account for the gatekeeper network
    ExpireToken {
        /// Padding for backwards compatibility
        padding: Option<AddressSeed>,
        /// The gatekeeper network
        gatekeeper_network: Pubkey,
    },

    /// Remove a gateway token from the system, closing the account. Unlike revoking a gateway token,
    /// this does not leave on open account on chain, and can be reversed by reissuing the token.
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]`            gateway_token: the account of the gateway token
    /// 1. `[signer]`              gatekeeper_authority: the gatekeeper authority that is burning the token
    /// 2. `[]`                    gatekeeper_account: the gatekeeper account linking the gatekeeper authority to the gatekeeper network
    /// 3. `[writeable]`           recipient: the recipient of the lamports in the gateway token account
    BurnToken,
}

/// Features are properties of a gatekeeper network that can be enabled or disabled.
/// They are represented by a PDA with a known address derivable from the gatekeeper network address
/// and the feature name.
#[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq, Eq)]
pub enum NetworkFeature {
    /// The UserTokenExpiry feature allows users to set an expiry time on their own gateway tokens.
    /// A use-case for this feature is a smart contract that checks and then expires a gateway token.
    /// This allows for "single-use" gateway tokens, e.g. for token sales or airdrops, which need to be
    /// re-activated after use.
    ///
    /// Note, all gateway tokens may have an expire time set by the gatekeeper, whether a network supports UserTokenExpiry
    /// or not.
    ///
    UserTokenExpiry,
}

/// Create a `GatewayInstruction::AddGatekeeper` instruction
pub fn add_gatekeeper(
    funder_account: &Pubkey,       // the payer of the transaction
    gatekeeper_authority: &Pubkey, // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey,   // the gatekeeper network to which the gatekeeper belongs
) -> Instruction {
    let (gatekeeper_account, _) =
        get_gatekeeper_account_address(gatekeeper_authority, gatekeeper_network);
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::AddGatekeeper {},
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, false),
            AccountMeta::new_readonly(*gatekeeper_network, true),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `GatewayInstruction::Issue` instruction
pub fn issue(
    funder_account: &Pubkey,            // the payer of the transaction
    owner: &Pubkey,                     // the wallet that the gateway token is issued for
    gatekeeper_account: &Pubkey, // the account containing details of the gatekeeper issuing the gateway token
    gatekeeper_authority: &Pubkey, // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey, // the gatekeeper network to which the gatekeeper belongs
    seed: Option<AddressSeed>,   // optional seed to use when generating a gateway token
    expire_time: Option<UnixTimestamp>, // optional unix timestamp at which point the issued token is no longer valid
) -> Instruction {
    let (gateway_token, _) = get_gateway_token_address_with_seed(owner, &seed, gatekeeper_network);
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::Issue { seed, expire_time },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gateway_token, false),
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_network, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `GatewayInstruction::SetState` instruction
pub fn set_state(
    gateway_token: &Pubkey,                 // the gateway token account
    gatekeeper_authority: &Pubkey,          // the authority that owns the gatekeeper account
    gatekeeper_account: &Pubkey, // the account containing details of the gatekeeper issuing the gateway token
    gateway_token_state: GatewayTokenState, // the state of the token to transition to
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::SetState {
            state: gateway_token_state,
        },
        vec![
            AccountMeta::new(*gateway_token, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `GatewayInstruction::UpdateExpiry` instruction
pub fn update_expiry(
    gateway_token: &Pubkey,        // the gateway token account
    gatekeeper_authority: &Pubkey, // the authority that owns the gatekeeper account
    gatekeeper_account: &Pubkey, // the account containing details of the gatekeeper that issued the gateway token
    expire_time: UnixTimestamp,  // new expiry time for the accountn
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::UpdateExpiry { expire_time },
        vec![
            AccountMeta::new(*gateway_token, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_account, false),
        ],
    )
}

/// Create a `GatewayInstruction::RemoveGatekeeper` instruction
pub fn remove_gatekeeper(
    funds_to_account: &Pubkey,
    gatekeeper_authority: &Pubkey,
    gatekeeper_network: &Pubkey,
) -> Instruction {
    let (gatekeeper_account, _) =
        get_gatekeeper_account_address(gatekeeper_authority, gatekeeper_network);
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::RemoveGatekeeper,
        vec![
            AccountMeta::new(*funds_to_account, false),
            AccountMeta::new(gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, false),
            AccountMeta::new_readonly(*gatekeeper_network, true),
        ],
    )
}

/// Create a `GatewayInstruction::ExpireToken` instruction
pub fn expire_token(
    gateway_token: Pubkey,
    owner: Pubkey,
    gatekeeper_network: Pubkey,
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::ExpireToken {
            padding: None,
            gatekeeper_network,
        },
        vec![
            AccountMeta::new(gateway_token, false),
            AccountMeta::new_readonly(owner, true),
            AccountMeta::new_readonly(get_expire_address_with_seed(&gatekeeper_network).0, false),
        ],
    )
}
pub fn add_feature_to_network(
    funder: Pubkey,
    gatekeeper_network: Pubkey,
    feature: NetworkFeature,
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::AddFeatureToNetwork { feature },
        vec![
            AccountMeta::new(funder, true),
            AccountMeta::new_readonly(gatekeeper_network, true),
            AccountMeta::new(get_expire_address_with_seed(&gatekeeper_network).0, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}
pub fn remove_feature_from_network(
    funds_to: Pubkey,
    gatekeeper_network: Pubkey,
    feature: NetworkFeature,
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::RemoveFeatureFromNetwork { feature },
        vec![
            AccountMeta::new(funds_to, false),
            AccountMeta::new_readonly(gatekeeper_network, true),
            AccountMeta::new(get_expire_address_with_seed(&gatekeeper_network).0, false),
        ],
    )
}

/// Create a `GatewayInstruction::BurnToken` instruction
pub fn burn_token(
    gateway_token: &Pubkey,        // the gateway token account
    gatekeeper_authority: &Pubkey, // the authority that owns the gatekeeper account
    gatekeeper_account: &Pubkey, // the account containing details of the gatekeeper that issued the gateway token
    recipient: &Pubkey,          // recipient of the lamports stored in the gateway token account
) -> Instruction {
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::BurnToken {},
        vec![
            AccountMeta::new(*gateway_token, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new(*recipient, false),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_issue() {
        let expected = [1, 0, 0];
        let instruction = GatewayInstruction::Issue {
            seed: None,
            expire_time: None,
        };
        assert_eq!(borsh::to_vec(&instruction).unwrap(), expected);
        assert_eq!(
            GatewayInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn deserialize_invalid_instruction() {
        let expected = vec![12];
        let err: ProgramError = GatewayInstruction::try_from_slice(&expected)
            .unwrap_err()
            .into();
        assert!(matches!(err, ProgramError::BorshIoError(_)));
    }
}
