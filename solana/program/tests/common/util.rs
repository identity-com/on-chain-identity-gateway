// Required for clippy in tests. https://github.com/rust-lang/rust/issues/46379#issuecomment-487421236
#![allow(dead_code)]

use solana_program::instruction::InstructionError;
use solana_program_test::BanksClientError;
use solana_sdk::signature::Keypair;
use solana_sdk::transaction::TransactionError;

pub fn assert_instruction_error(
    result: Result<(), BanksClientError>,
    expected_instruction_error: InstructionError,
) {
    assert!(matches!(
        result,
        Err(BanksClientError::TransactionError(TransactionError::InstructionError(
            0,
            instruction_error
        ))) if instruction_error == expected_instruction_error
    ));
}

/// Create a new keypair with the same bytes as the given keypair
/// Keypair does not implement Clone, so this is a workaround
pub fn clone_keypair(keypair: &Keypair) -> Keypair {
    Keypair::from_bytes(&keypair.to_bytes()).unwrap()
}
