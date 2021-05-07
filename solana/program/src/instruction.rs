//! Program instructions

use {
    crate::{
        id,
        state::{get_gateway_address_with_seed, Message, GatewayData},
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
pub enum GatewayInstruction {
    /// Issue a new gateway token
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[writable]` Unallocated gateway token account, must be a program address
    /// 2. `[]` Gateway owner DID
    /// 3. `[]` Rent sysvar
    /// 4. `[]` System program
    Issue {
        
    }
}

/// Create a `GatewayInstruction::Issue` instruction
pub fn issue(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    size: u8,
    alias: String
) -> Instruction {
    let (gateway_account, _) = get_gateway_address_with_seed(owner_did);
    Instruction::new_with_borsh(
        id(),
        &GatewayInstruction::Issue { },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gateway_account, false),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::tests::test_gateway_data;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_issue() {
        let size = GatewayData::DEFAULT_SIZE;
        let alias = "Alice";
        let init_data = test_gateway_data();
        let mut expected = vec![0];
        expected.extend_from_slice(&size.to_le_bytes());
        expected.append(&mut init_data.try_to_vec().unwrap());
        let instruction = GatewayInstruction::Initialize { };//size, alias };
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
