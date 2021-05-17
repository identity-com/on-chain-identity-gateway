// Mark this test as BPF-only due to current `ProgramTest` limitations when CPIing into the system program
#![cfg(feature = "test-bpf")]

use {
    borsh::BorshSerialize,
    solana_gateway_program::{
        error::GatewayError,
        id, instruction,
        processor::process_instruction,
        state::{
            Gatekeeper
        }
    },
    solana_gateway::{
        state::{GatewayToken},
        borsh as program_borsh,
    },
    solana_program::{
        instruction::{AccountMeta, Instruction, InstructionError},
        pubkey::Pubkey,
        rent::Rent,
    },
    solana_program_test::{processor, tokio, ProgramTest, ProgramTestContext},
    solana_sdk::{
        account::Account,
        account_info::IntoAccountInfo,
        program_error::ProgramError,
        signature::{Keypair, Signer},
        transaction::{Transaction, TransactionError},
        transport,
    },
};
use solana_gateway_program::state::get_gatekeeper_address_with_seed;

fn program_test() -> ProgramTest {
    ProgramTest::new("solana_gateway_program", id(), processor!(process_instruction))
}

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = GatewayContext::new();

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let gatekeeper = context.add_gatekeeper(&authority, &network)
        .await
        .unwrap();
    
    assert_eq!(gatekeeper.authority, authority);
    assert_eq!(gatekeeper.network, network.pubkey());
}
