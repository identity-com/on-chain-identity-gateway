#![cfg(feature = "test-sbf")]

mod common;

use common::util::{assert_instruction_error, clone_keypair};
use solana_gateway::instruction;
use solana_gateway::state::{
    get_gatekeeper_account_address, get_gateway_token_address_with_seed, GatewayTokenState,
};
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
async fn revoke_should_succeed() {
    let mut context = setup().await;

    // revoke the token
    let revoked_gateway_token = context
        .set_gateway_token_state(&context.owner.pubkey(), GatewayTokenState::Revoked)
        .await;

    assert_eq!(revoked_gateway_token.state, GatewayTokenState::Revoked);
}

#[tokio::test]
async fn revoking_a_revoked_pass_should_work_with_no_changes() {
    let mut context = setup().await;

    // revoke the token
    context
        .set_gateway_token_state(&context.owner.pubkey(), GatewayTokenState::Revoked)
        .await;

    // revoke again
    let revoked_gateway_token = context
        .set_gateway_token_state(&context.owner.pubkey(), GatewayTokenState::Revoked)
        .await;

    assert_eq!(revoked_gateway_token.state, GatewayTokenState::Revoked);
}

#[tokio::test]
async fn set_state_wrong_account_type_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());

    let tx = context.set_gateway_token_state_detailed(
        &context.gatekeeper_account.unwrap(),
        &authority,
        &context.gatekeeper_account.unwrap(),
        GatewayTokenState::Revoked,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(2)); // InvalidToken
}

#[tokio::test]
async fn set_state_non_gateway_account_type_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());

    let account = Pubkey::new_unique();

    let tx = context.set_gateway_token_state_detailed(
        &account,
        &authority,
        &context.gatekeeper_account.unwrap(),
        GatewayTokenState::Revoked,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::IncorrectProgramId);
}

#[tokio::test]
async fn set_state_wrong_gatekeeper_should_fail() {
    let mut context = setup().await;

    let wrong_gatekeeper = Keypair::new();

    let (gateway_token, _) = get_gateway_token_address_with_seed(
        &context.owner.pubkey(),
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = context.set_gateway_token_state_detailed(
        &gateway_token,
        &wrong_gatekeeper,
        &context.gatekeeper_account.unwrap(),
        GatewayTokenState::Revoked,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(0)); // IncorrectGatekeeper
}

#[tokio::test]
async fn freeze_with_different_gatekeeper_in_network_should_fail() {
    let mut context = setup().await;

    // add a new gatekeeper to the network
    let other_gatekeeper = Keypair::new();
    let network = clone_keypair(context.gatekeeper_network.as_ref().unwrap());
    let tx = context.add_gatekeeper_transaction(&other_gatekeeper.pubkey(), &network);
    context.execute_transaction(tx).await.unwrap();

    let other_gatekeeper_account =
        get_gatekeeper_account_address(&other_gatekeeper.pubkey(), &network.pubkey()).0;

    let (gateway_token, _) = get_gateway_token_address_with_seed(
        &context.owner.pubkey(),
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = context.set_gateway_token_state_detailed(
        &gateway_token,
        &other_gatekeeper,
        &other_gatekeeper_account,
        GatewayTokenState::Frozen,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(0)); // IncorrectGatekeeper
}

#[tokio::test]
async fn revoke_with_different_gatekeeper_in_network_should_pass() {
    let mut context = setup().await;

    // add a new gatekeeper to the network
    let other_gatekeeper = Keypair::new();
    let network = clone_keypair(context.gatekeeper_network.as_ref().unwrap());
    let tx = context.add_gatekeeper_transaction(&other_gatekeeper.pubkey(), &network);
    context.execute_transaction(tx).await.unwrap();

    let other_gatekeeper_account =
        get_gatekeeper_account_address(&other_gatekeeper.pubkey(), &network.pubkey()).0;

    let (gateway_token, _) = get_gateway_token_address_with_seed(
        &context.owner.pubkey(),
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = context.set_gateway_token_state_detailed(
        &gateway_token,
        &other_gatekeeper,
        &other_gatekeeper_account,
        GatewayTokenState::Revoked,
    );

    // revoke should work as long as the gatekeeper is in the network
    context.execute_transaction(tx).await.unwrap();
}

#[tokio::test]
async fn set_state_invalid_state_change_should_fail() {
    let mut context = setup().await;

    // revoke the token
    context
        .set_gateway_token_state(&context.owner.pubkey(), GatewayTokenState::Revoked)
        .await;

    // attempt to re-activate
    let tx = context
        .set_gateway_token_state_transaction(&context.owner.pubkey(), GatewayTokenState::Active);

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(5)); // InvalidStateChange
}

#[tokio::test]
async fn set_state_missing_gatekeeper_signature_should_fail() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());
    let network = &context.gatekeeper_network.as_ref().unwrap().pubkey();
    let (gatekeeper_account, _) = get_gatekeeper_account_address(&authority.pubkey(), network);

    let mut ix = instruction::set_state(
        &context.context.borrow().payer.pubkey(),
        &context.owner.pubkey(),
        &gatekeeper_account,
        GatewayTokenState::Revoked,
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
