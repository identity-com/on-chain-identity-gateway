#![cfg(feature = "test-sbf")]
#![allow(clippy::await_holding_refcell_ref)]

mod common;

use common::util::assert_instruction_error;
use solana_gateway::state::get_gatekeeper_account_address;
use solana_gateway::{instruction, Gateway};
use solana_program::instruction::InstructionError;
use solana_sdk::signature::{Keypair, Signer};
use solana_sdk::transaction::Transaction;
use {
    common::gateway_context::GatewayContext, solana_program::pubkey::Pubkey,
    solana_program_test::tokio,
};

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = GatewayContext::new().await;

    context.create_gatekeeper_keys();
    let _gatekeeper = context.add_gatekeeper().await;
}

#[tokio::test]
async fn add_gatekeeper_should_fail_without_gatekeeper_network_signature() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper_keys();

    let authority = &context.gatekeeper_authority.as_ref().unwrap().pubkey();
    let network = Keypair::new();

    let result = context
        .attempt_add_gatekeeper_without_network_signature(authority, &network.pubkey())
        .await;

    assert!(result.is_err());
}

#[tokio::test]
async fn add_gatekeeper_should_fail_without_funder_signature() {
    let mut context = GatewayContext::new().await;

    let some_funder = Keypair::new();

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let mut ix = instruction::add_gatekeeper(&some_funder.pubkey(), &authority, &network.pubkey());

    ix.accounts[0].is_signer = false;

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &network],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::MissingRequiredSignature);
}

#[tokio::test]
async fn add_gatekeeper_account_should_fail_with_incorrect_gatekeeper_account() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper_keys();

    let mut ix = instruction::add_gatekeeper(
        &context.context.borrow().payer.pubkey(),
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    ix.accounts[1].pubkey = Pubkey::new_unique(); // gatekeeper account index is 1

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[
            &context.context.borrow().payer,
            context.gatekeeper_network.as_ref().unwrap(),
        ],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::InvalidArgument);
}

#[tokio::test]
async fn remove_gatekeeper_account_should_succeed() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let (gatekeeper_address, _) = get_gatekeeper_account_address(
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    let account = context
        .context
        .borrow_mut()
        .banks_client
        .get_account(gatekeeper_address)
        .await
        .unwrap()
        .unwrap();

    assert_eq!(account.owner, Gateway::program_id());

    let funds_to = context.remove_gatekeeper().await;

    assert_eq!(
        context
            .context
            .borrow_mut()
            .banks_client
            .get_account(gatekeeper_address)
            .await
            .unwrap(),
        None
    );
    assert_eq!(
        context
            .context
            .borrow_mut()
            .banks_client
            .get_account(funds_to)
            .await
            .unwrap()
            .unwrap()
            .lamports,
        account.lamports
    );
}

#[tokio::test]
async fn remove_gatekeeper_should_fail_without_network_signature() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let funds_to = Pubkey::new_unique();
    let authority = &context.gatekeeper_authority.as_ref().unwrap().pubkey();
    let network = Keypair::new();
    let mut ix = instruction::remove_gatekeeper(&funds_to, authority, &network.pubkey());

    ix.accounts[3].is_signer = false; // gatekeeper network index is 3

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::MissingRequiredSignature);
}

#[tokio::test]
async fn remove_gatekeeper_account_should_fail_with_incorrect_gatekeeper_account() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let funds_to = Pubkey::new_unique();
    let mut ix = instruction::remove_gatekeeper(
        &funds_to,
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    ix.accounts[1].pubkey = Pubkey::new_unique(); // gatekeeper account index is 1

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[
            &context.context.borrow().payer,
            context.gatekeeper_network.as_ref().unwrap(),
        ],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::InvalidArgument);
}
