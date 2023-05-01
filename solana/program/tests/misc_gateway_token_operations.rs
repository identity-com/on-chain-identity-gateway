#![cfg(feature = "test-sbf")]

mod common;

use solana_gateway_program::{instruction, Gateway};
use solana_program::instruction::Instruction;
use solana_sdk::signature::Signer;
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
async fn executing_an_unknown_instruction_should_fail() {
    let mut context = setup().await;

    let dummy_instruction = Instruction::new_with_bytes(Gateway::program_id(), &[100], vec![]);
    let transaction = Transaction::new_signed_with_payer(
        &[dummy_instruction],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(transaction).await;

    assert!(result.is_err());
}

#[tokio::test]
async fn burn_and_reissue_a_gateway_token() {
    let mut context = setup().await;

    // burn the gateway token
    context.burn_gateway_token(&context.owner.pubkey()).await;

    // re-issue it
    let gateway_token = context
        .issue_gateway_token(&context.owner.pubkey(), Some(4794223772))
        .await;

    assert_eq!(gateway_token.owner_wallet, context.owner.pubkey());
    assert_eq!(
        gateway_token.issuing_gatekeeper,
        context.gatekeeper_authority.unwrap().pubkey()
    );
}
