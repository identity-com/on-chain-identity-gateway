//! Program instructions

use crate::state::get_expire_address_with_seed;
use crate::Gateway;
use solana_program::clock::UnixTimestamp;
use {
    crate::state::GatewayTokenState,
    crate::state::{
        get_gatekeeper_address_with_seed, get_gateway_token_address_with_seed, AddressSeed,
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program, sysvar,
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
    IssueVanilla {
        /// An optional seed to use when generating a gateway token
        /// allowing multiple gateway tokens per wallet
        seed: Option<AddressSeed>,
        /// An optional unix timestamp at which point the issued token is no longer valid
        expire_time: Option<UnixTimestamp>,
    },

    /// Update the gateway token state
    /// Revoke, freeze or unfreeze
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
    /// 3. `[signer]`              gatekeeper_network: the gatekeeper network to which the gatekeeper belong
    RemoveGatekeeper,

    /// 0. `[signer, writable]` funder_account: The account funding this transaction
    /// 1. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
    /// 2. `[writable]`         feature_account: The new feature account
    /// 3. `[]`                 system_program: The system program
    AddFeatureToNetwork { feature: NetworkFeature },

    /// 0. `[signer, writable]` funds_to_account: The account receiving the funds
    /// 1. `[signer]`           gatekeeper_network: The gatekeeper network receiving a feature
    /// 2. `[writable]`         feature_account: The new feature account
    RemoveFeatureFromNetwork { feature: NetworkFeature },

    /// 0. `[writable]`    gateway_token: The token to expire
    /// 1. `[signer]`      owner: The wallet that the gateway token is for
    /// 2. `[]`            network_expire_feature: The expire feature for the gatekeeper network
    ExpireToken {
        /// Padding for backwards compatibility
        padding: Option<AddressSeed>,
        /// The gatekeeper network
        gatekeeper_network: Pubkey,
    },
}

#[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq, Eq)]
pub enum NetworkFeature {
    UserTokenExpiry,
}

/// Create a `GatewayInstruction::AddGatekeeper` instruction
pub fn add_gatekeeper(
    funder_account: &Pubkey,       // the payer of the transaction
    gatekeeper_authority: &Pubkey, // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey,   // the gatekeeper network to which the gatekeeper belongs
) -> Instruction {
    let (gatekeeper_account, _) =
        get_gatekeeper_address_with_seed(gatekeeper_authority, gatekeeper_network);
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::AddGatekeeper {},
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, false),
            AccountMeta::new_readonly(*gatekeeper_network, true),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `GatewayInstruction::IssueVanilla` instruction
pub fn issue_vanilla(
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
        &GatewayInstruction::IssueVanilla { seed, expire_time },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gateway_token, false),
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_network, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
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
            AccountMeta::new_readonly(sysvar::rent::id(), false),
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
    let (gatekeeper_address, _) =
        get_gatekeeper_address_with_seed(gatekeeper_authority, gatekeeper_network);
    Instruction::new_with_borsh(
        Gateway::program_id(),
        &GatewayInstruction::RemoveGatekeeper,
        vec![
            AccountMeta::new(*funds_to_account, false),
            AccountMeta::new(gatekeeper_address, false),
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

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_issue_vanilla() {
        let expected = [1, 0, 0];
        let instruction = GatewayInstruction::IssueVanilla {
            seed: None,
            expire_time: None,
        };
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
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
