//! Program instructions

use {
    crate::{
        id,
        state::{get_gateway_token_address_with_seed, get_gatekeeper_address_with_seed, AddressSeed},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program, sysvar,
    },
    solana_gateway::state::{GatewayTokenState},
};
use solana_program::clock::UnixTimestamp;

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
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
        expire_time: Option<UnixTimestamp>
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
        state: GatewayTokenState
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
        expire_time: UnixTimestamp
    }
}

/// Create a `GatewayInstruction::AddGatekeeper` instruction
pub fn add_gatekeeper(
    funder_account: &Pubkey,        // the payer of the transaction
    gatekeeper_authority: &Pubkey,  // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey,    // the gatekeeper network to which the gatekeeper belongs
) -> Instruction {
    let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(gatekeeper_authority);
    Instruction::new_with_borsh(
        id(),
        &GatewayInstruction::AddGatekeeper { },
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
    funder_account: &Pubkey,        // the payer of the transaction
    owner: &Pubkey,                 // the wallet that the gateway token is issued for
    gatekeeper_account: &Pubkey,    // the account containing details of the gatekeeper issuing the gateway token
    gatekeeper_authority: &Pubkey,  // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey,    // the gatekeeper network to which the gatekeeper belongs
    seed: Option<AddressSeed>,       // optional seed to use when generating a gateway token
    expire_time: Option<UnixTimestamp>// optional unix timestamp at which point the issued token is no longer valid
) -> Instruction {
    let (gateway_token, _) = get_gateway_token_address_with_seed(owner, &seed);
    Instruction::new_with_borsh(
        id(),
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


/// Create a `GatewayInstruction::UpdateExpiry` instruction
pub fn update_expiry(
    gateway_token: &Pubkey,         // the gateway token account
    gatekeeper_account: &Pubkey,    // the account containing details of the gatekeeper that issued the gateway token
    gatekeeper_authority: &Pubkey,  // the authority that owns the gatekeeper account
    expire_time: UnixTimestamp      // new expiry time for the accountn
) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &GatewayInstruction::UpdateExpiry { expire_time },
        vec![
            AccountMeta::new(*gateway_token, false),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_issue_vanilla() {
        let expected = [1,0,0];
        let instruction = GatewayInstruction::IssueVanilla { seed: None, expire_time: None };
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
