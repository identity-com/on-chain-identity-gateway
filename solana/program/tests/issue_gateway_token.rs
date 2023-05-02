#![cfg(feature = "test-sbf")]

mod common;

use common::util::{assert_instruction_error, clone_keypair};
use solana_gateway::instruction;
use solana_gateway::state::{get_gatekeeper_account_address, get_gateway_token_address_with_seed};
use solana_program::instruction::InstructionError;
use solana_program::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};
use solana_sdk::transaction::Transaction;
use {common::gateway_context::GatewayContext, solana_program_test::tokio};

async fn setup() -> GatewayContext {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;
    context
}

#[tokio::test]
async fn issue_should_succeed() {
    let mut context = setup().await;

    let gateway_token = context
        .issue_gateway_token(&context.owner.pubkey(), None)
        .await;

    assert_eq!(gateway_token.owner_wallet, context.owner.pubkey());
    assert_eq!(
        gateway_token.issuing_gatekeeper,
        context.gatekeeper_authority.unwrap().pubkey()
    );
}

#[tokio::test]
async fn issue_with_expiry_should_succeed() {
    let mut context = setup().await;

    let future = GatewayContext::now() + 100_000;

    // now issue a gateway token
    let gateway_token = context
        .issue_gateway_token(&context.owner.pubkey(), Some(future))
        .await;

    assert_eq!(gateway_token.expire_time.unwrap(), future);
}

#[tokio::test]
async fn issue_an_expired_gateway_token_should_be_invalid() {
    let mut context = setup().await;

    let past = GatewayContext::now() - 100_000;

    // issue an expired gateway token
    let gateway_token = context
        .issue_gateway_token(&context.owner.pubkey(), Some(past))
        .await;

    // we cannot use is_valid as it needs the sysvar clock which is not available here
    assert_eq!(gateway_token.expire_time.unwrap(), past);
}

#[tokio::test]
async fn issue_should_fail_if_wrong_gatekeeper_account() {
    let mut context = setup().await;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();
    let (token, _) = get_gateway_token_address_with_seed(
        &context.owner.pubkey(),
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = context.issue_gateway_token_detailed(
        &context.owner.pubkey(),
        &authority,
        &token,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
        None,
    );

    let result = context.execute_transaction(tx).await;

    assert!(result.is_err());
}

#[tokio::test]
#[should_panic]
async fn issue_should_fail_if_gatekeeper_removed() {
    let mut context = setup().await;

    // remove the gatekeeper
    context.remove_gatekeeper().await;

    // this should panic
    context
        .issue_gateway_token(&context.owner.pubkey(), None)
        .await;
}

#[tokio::test]
async fn issue_should_fail_if_gatekeeper_not_added() {
    let mut context = setup().await;

    let false_gatekeeper = Keypair::new();
    let (false_gatekeeper_account, _) = get_gatekeeper_account_address(
        &false_gatekeeper.pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = context.issue_gateway_token_detailed(
        &context.owner.pubkey(),
        &false_gatekeeper,
        &false_gatekeeper_account,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
        None,
    );

    let result = context.execute_transaction(tx).await;

    assert!(result.is_err());
}

#[tokio::test]
async fn issue_should_fail_without_gatekeeper_signature() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());
    let network = &context.gatekeeper_network.as_ref().unwrap().pubkey();
    let (gatekeeper_account, _) = get_gatekeeper_account_address(&authority.pubkey(), network);

    let mut ix = instruction::issue(
        &context.context.borrow().payer.pubkey(),
        &context.owner.pubkey(),
        &gatekeeper_account,
        &authority.pubkey(),
        network,
        None,
        None,
    );

    // gatekeeper authority has index 4
    ix.accounts[4].is_signer = false;

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
async fn issue_should_fail_if_wrong_gateway_token_account() {
    let mut context = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());
    let network = &context.gatekeeper_network.as_ref().unwrap().pubkey();
    let (gatekeeper_account, _) = get_gatekeeper_account_address(&authority.pubkey(), network);

    let mut ix = instruction::issue(
        &context.context.borrow().payer.pubkey(),
        &context.owner.pubkey(),
        &gatekeeper_account,
        &authority.pubkey(),
        network,
        None,
        None,
    );

    // replace the gateway token account with a random one
    ix.accounts[1].pubkey = Pubkey::new_unique();

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &authority],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::InvalidArgument);
}

#[tokio::test]
async fn issue_should_fail_if_already_issued() {
    let mut context = setup().await;

    context
        .issue_gateway_token(&context.owner.pubkey(), None)
        .await;

    let tx = context.issue_gateway_token_transaction(&context.owner.pubkey(), Some(100));

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::AccountAlreadyInitialized);
}
