#![cfg(feature = "test-sbf")]

mod common;

use common::util::{assert_instruction_error, clone_keypair};
use solana_gateway::instruction;
use solana_gateway::state::get_gatekeeper_account_address;
use solana_program::instruction::InstructionError;
use solana_program::instruction::InstructionError::Custom;
use solana_program::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};
use solana_sdk::transaction::Transaction;
use {common::gateway_context::GatewayContext, solana_program_test::tokio};

async fn setup() -> GatewayContext {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    // issue a token
    context
        .issue_gateway_token(&context.owner.pubkey(), None)
        .await;

    context
}

#[tokio::test]
async fn burn_should_succeed() {
    let mut context = setup().await;

    // burn the token
    context.burn_gateway_token(&context.owner.pubkey()).await;

    let gt_option = context.get_gateway_token(&context.owner.pubkey()).await;
    assert!(gt_option.is_none());
}

#[tokio::test]
async fn burn_wrong_account_type_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());

    let tx = Transaction::new_signed_with_payer(
        &[instruction::burn_token(
            &context.gatekeeper_account.unwrap(), // incorrect gateway token
            &authority.pubkey(),
            &context.gatekeeper_account.unwrap(),
            &Pubkey::new_unique(),
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &authority],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(2)); // InvalidToken
}

#[tokio::test]
async fn burn_non_gateway_account_type_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());

    let account = Pubkey::new_unique();

    let tx = Transaction::new_signed_with_payer(
        &[instruction::burn_token(
            &account, // incorrect gateway token
            &authority.pubkey(),
            &context.gatekeeper_account.unwrap(),
            &Pubkey::new_unique(),
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &authority],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::IncorrectProgramId);
}

#[tokio::test]
async fn burn_wrong_gatekeeper_should_fail() {
    let mut context = setup().await;

    let wrong_gatekeeper = Keypair::new();

    let tx = context.burn_gateway_token_transaction(
        &context.owner.pubkey(),
        &wrong_gatekeeper,
        &context.gatekeeper_account.unwrap(),
        &Pubkey::new_unique(),
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(0)); // IncorrectGatekeeper
}

#[tokio::test]
async fn burn_missing_gatekeeper_signature_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());
    let network = &context.gatekeeper_network.as_ref().unwrap().pubkey();
    let (gatekeeper_account, _) = get_gatekeeper_account_address(&authority.pubkey(), network);

    let mut ix = instruction::burn_token(
        &context.context.borrow().payer.pubkey(),
        &context.owner.pubkey(),
        &gatekeeper_account,
        &Pubkey::new_unique(),
    );
    // gatekeeper authority has index 1
    ix.accounts[1].is_signer = false;

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::MissingRequiredSignature);
}
