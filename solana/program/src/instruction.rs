//! Program instructions

use {
    crate::{
        id,
        state::{get_inbox_address_with_seed, Message, InboxData},
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
pub enum SolariumInstruction {
    /// Create a new inbox
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]` Funding account, must be a system account
    /// 1. `[writable]` Unallocated inbox account, must be a program address
    /// 2. `[]` Inbox owner DID
    /// 3. `[]` Rent sysvar
    /// 4. `[]` System program
    Initialize {
        // /// Size of the inbox
        // size: u8,
        // /// Username attached to the inbox
        // alias: String,
    },

    /// Post a message to the provided inbox account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]` Inbox account, must be previously initialized
    /// 1. `[]` Sender DID account
    /// 2. `[signer]` Sender signer account (must be an authority on the sender DID)
    Post {
        /// Data to replace the existing record data
        message: String,
    },

    /// Close the provided inbox account, draining lamports to recipient account
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable]` Inbox account, must be previously initialized
    /// 1. `[]` Inbox owner DID account
    /// 2. `[signer]` Inbox signer account (must be an authority on the owner DID)
    /// 3. `[]` Receiver of account lamports
    CloseAccount,
}

/// Create a `SolariumInstruction::Initialize` instruction
pub fn initialize(
    funder_account: &Pubkey,
    owner_did: &Pubkey,
    size: u8,
    alias: String
) -> Instruction {
    let (inbox_account, _) = get_inbox_address_with_seed(owner_did);
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Initialize { },//size, alias },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(inbox_account, false),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(sysvar::rent::id(), false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )
}

/// Create a `SolariumInstruction::Write` instruction
pub fn post(inbox_account: &Pubkey, signer: &Pubkey, message: &Message) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::Post { message: message.content.to_string() },
        vec![
            AccountMeta::new(*inbox_account, false),
            AccountMeta::new_readonly(message.sender, false),
            AccountMeta::new_readonly(*signer, true),
        ],
    )
}

/// Create a `SolariumInstruction::CloseAccount` instruction
pub fn close_account(inbox_account: &Pubkey, owner_did: &Pubkey, owner: &Pubkey, receiver: &Pubkey) -> Instruction {
    Instruction::new_with_borsh(
        id(),
        &SolariumInstruction::CloseAccount,
        vec![
            AccountMeta::new(*inbox_account, false),
            AccountMeta::new_readonly(*owner_did, false),
            AccountMeta::new_readonly(*owner, true),
            AccountMeta::new(*receiver, false),
        ],
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::tests::test_inbox_data;
    use solana_program::program_error::ProgramError;

    #[test]
    fn serialize_initialize() {
        let size = InboxData::DEFAULT_SIZE;
        let alias = "Alice";
        let init_data = test_inbox_data();
        let mut expected = vec![0];
        expected.extend_from_slice(&size.to_le_bytes());
        expected.append(&mut init_data.try_to_vec().unwrap());
        let instruction = SolariumInstruction::Initialize { };//size, alias };
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn serialize_write() {
        let data = test_inbox_data().try_to_vec().unwrap();
        let offset = 0u64;
        let instruction = SolariumInstruction::Write {
            offset: 0,
            data: data.clone(),
        };
        let mut expected = vec![1];
        expected.extend_from_slice(&offset.to_le_bytes());
        expected.append(&mut data.try_to_vec().unwrap());
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn serialize_close_account() {
        let instruction = SolariumInstruction::CloseAccount;
        let expected = vec![2];
        assert_eq!(instruction.try_to_vec().unwrap(), expected);
        assert_eq!(
            SolariumInstruction::try_from_slice(&expected).unwrap(),
            instruction
        );
    }

    #[test]
    fn deserialize_invalid_instruction() {
        let expected = vec![12];
        let err: ProgramError = SolariumInstruction::try_from_slice(&expected)
            .unwrap_err()
            .into();
        assert!(matches!(err, ProgramError::BorshIoError(_)));
    }
}
