//! Program instructions

use {
    crate::{
        id,
        state::{get_gateway_token_address_with_seed, AddressSeed},
    },
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        system_program, sysvar,
    }
};

/// Instructions supported by the program
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, PartialEq)]
pub enum GatewayInstruction {
    /// Issue a new gateway token
    ///
    /// Accounts expected by this instruction:
    ///
    /// 0. `[writable, signer]`    funder_account: the payer of the transaction
    //  1. `[writable]`            gateway_token: the destination account of the gateway token
    //  2. `[]`                    owner: the wallet that the gateway token is issued for
    //  3. `[]`                    gatekeeper_account: the account containing details of the gatekeeper issuing the gateway token
    //  4. `[signer]`              gatekeeper_authority: the authority that owns the gatekeeper account
    //  5. `[]`                    gatekeeper_network: the gatekeeper network to which the gatekeeper belongs
    /// 6. `[]`                    Rent sysvar
    /// 7. `[]`                    System program
    IssueVanilla {
        /// An optional seed to use when generating a gateway token
        /// allowing multiple gateway tokens per wallet
        seed: Option<AddressSeed>
    }
}

/// Create a `GatewayInstruction::Issue` instruction
pub fn issue_vanilla(
    funder_account: &Pubkey,        // the payer of the transaction
    owner: &Pubkey,                 // the wallet that the gateway token is issued for
    gatekeeper_account: &Pubkey,    // the account containing details of the gatekeeper issuing the gateway token
    gatekeeper_authority: &Pubkey,  // the authority that owns the gatekeeper account
    gatekeeper_network: &Pubkey,    // the gatekeeper network to which the gatekeeper belongs
    seed: Option<AddressSeed>       // optional seed to use when generating a gateway token
) -> Instruction {
    let (gateway_account, _) = get_gateway_token_address_with_seed(owner, &seed);
    Instruction::new_with_borsh(
        id(),
        &GatewayInstruction::IssueVanilla { seed },
        vec![
            AccountMeta::new(*funder_account, true),
            AccountMeta::new(gateway_account, false),
            
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new_readonly(*gatekeeper_account, false),
            AccountMeta::new_readonly(*gatekeeper_authority, true),
            AccountMeta::new_readonly(*gatekeeper_network, false),
            
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
