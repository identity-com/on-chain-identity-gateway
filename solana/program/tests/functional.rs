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
    ProgramTest::new("gateway-program", id(), processor!(process_instruction))
}

async fn add_gatekeeper(
    context: &mut ProgramTestContext,
    authority: &Pubkey,
    network: &Keypair,
) -> transport::Result<()> {
    let transaction = Transaction::new_signed_with_payer(
        &[instruction::add_gatekeeper(
            &context.payer.pubkey(),
            authority,
            &network.pubkey(),
        )],
        Some(&context.payer.pubkey()),
        &[&context.payer, &network],
        context.last_blockhash,
    );
    context.banks_client.process_transaction(transaction).await
}

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = program_test().start_with_context().await;

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let (gatekeeper_address, _) = get_gatekeeper_address_with_seed(&authority);
    add_gatekeeper(&mut context, &authority, &network)
        .await
        .unwrap();
    let account_info = context
        .banks_client
        .get_account(gatekeeper_address)
        .await
        .unwrap()
        .unwrap();
    let account_data: Gatekeeper =
        program_borsh::try_from_slice_incomplete::<Gatekeeper>(&account_info.data).unwrap();
    
    assert_eq!(account_data.authority, authority);
    assert_eq!(account_data.network, network.pubkey());
}
