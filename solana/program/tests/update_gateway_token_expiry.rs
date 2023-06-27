#![cfg(feature = "test-sbf")]
#![allow(clippy::await_holding_refcell_ref)]

mod common;

use crate::instruction::{add_feature_to_network, expire_token, NetworkFeature};
use common::util::{assert_instruction_error, clone_keypair};
use solana_gateway::instruction;
use solana_gateway::state::{get_gatekeeper_account_address, get_gateway_token_address_with_seed};
use solana_program::instruction::InstructionError;
use solana_program::instruction::InstructionError::Custom;
use solana_program::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};
use solana_sdk::transaction::Transaction;
use {common::gateway_context::GatewayContext, solana_program_test::tokio};

async fn setup() -> (GatewayContext, Pubkey) {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    // issue a token
    context
        .issue_gateway_token(&context.owner.pubkey(), None)
        .await;

    let gateway_token_address = get_gateway_token_address_with_seed(
        &context.owner.pubkey(),
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    )
    .0;

    (context, gateway_token_address)
}

async fn add_expire_feature(context: &mut GatewayContext) {
    let add_feature_tx = Transaction::new_signed_with_payer(
        &[add_feature_to_network(
            context.context.borrow().payer.pubkey(),
            context.gatekeeper_network.as_ref().unwrap().pubkey(),
            NetworkFeature::UserTokenExpiry,
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[
            &context.context.borrow().payer,
            context.gatekeeper_network.as_ref().unwrap(),
        ],
        context.context.borrow().last_blockhash,
    );
    context
        .context
        .borrow_mut()
        .banks_client
        .process_transaction(add_feature_tx)
        .await
        .unwrap();
}

#[tokio::test]
async fn update_the_expiry_of_a_gateway_token() {
    let mut context = setup().await.0;

    let future = GatewayContext::now() + 100_000;

    // update the expire time
    let updated_gateway_token = context
        .update_gateway_token_expiry(&context.owner.pubkey(), future)
        .await;

    // we cannot use is_valid as it needs the sysvar clock which is not available here
    assert_eq!(updated_gateway_token.expire_time.unwrap(), future);
}

#[tokio::test]
async fn update_expiry_incorrect_gatekeeper_should_fail() {
    let mut context = setup().await.0;

    let future = GatewayContext::now() + 100_000;

    let wrong_authority = Keypair::new();

    let tx = context.update_gateway_token_expiry_transaction(
        &context.owner.pubkey(),
        &wrong_authority,
        &context.gatekeeper_account.unwrap(),
        future,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(0)); // IncorrectGatekeeper
}

#[tokio::test]
async fn update_expiry_wrong_account_should_fail() {
    let context = setup().await.0;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();

    let result = {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &context.gatekeeper_account.unwrap(),
                &authority.pubkey(),
                &context.gatekeeper_account.unwrap(),
                10,
            )],
            Some(&context.context.borrow().payer.pubkey()),
            &[&context.context.borrow().payer, &authority],
            context.context.borrow().last_blockhash,
        );

        context
            .context
            .borrow_mut()
            .banks_client
            .process_transaction(transaction)
            .await
    };

    assert_instruction_error(result, Custom(2)); // InvalidToken
}

#[tokio::test]
async fn update_expiry_non_gateway_account_should_fail() {
    let context = setup().await.0;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();

    let account = Pubkey::new_unique();

    let result = {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &account,
                &authority.pubkey(),
                &context.gatekeeper_account.unwrap(),
                10,
            )],
            Some(&context.context.borrow().payer.pubkey()),
            &[&context.context.borrow().payer, &authority],
            context.context.borrow().last_blockhash,
        );

        context
            .context
            .borrow_mut()
            .banks_client
            .process_transaction(transaction)
            .await
    };

    assert_instruction_error(result, InstructionError::IncorrectProgramId);
}

#[tokio::test]
async fn update_expiry_missing_gatekeeper_signature_should_fail() {
    let (mut context, gateway_token_address) = setup().await;

    let authority = clone_keypair(context.gatekeeper_authority.as_ref().unwrap());
    let network = &context.gatekeeper_network.as_ref().unwrap().pubkey();
    let (gatekeeper_account, _) = get_gatekeeper_account_address(&authority.pubkey(), network);

    let mut ix = instruction::update_expiry(
        &gateway_token_address,
        &context.owner.pubkey(),
        &gatekeeper_account,
        100,
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

#[tokio::test]
async fn expire_token_should_succeed() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to the gatekeeper network
    add_expire_feature(&mut context).await;

    let expire_tx = Transaction::new_signed_with_payer(
        &[expire_token(
            gateway_token_address,
            context.owner.pubkey(),
            context.gatekeeper_network.as_ref().unwrap().pubkey(),
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &context.owner],
        context.context.borrow().last_blockhash,
    );

    context
        .context
        .borrow_mut()
        .banks_client
        .process_transaction(expire_tx)
        .await
        .unwrap();

    let now = GatewayContext::now();
    let gateway_token = context
        .get_gateway_token(&context.owner.pubkey())
        .await
        .unwrap();
    assert!(gateway_token.expire_time.unwrap() <= now);
}

#[tokio::test]
async fn expire_token_should_fail_if_feature_not_present() {
    let (mut context, gateway_token_address) = setup().await;

    let tx = Transaction::new_signed_with_payer(
        &[expire_token(
            gateway_token_address,
            context.owner.pubkey(),
            context.gatekeeper_network.as_ref().unwrap().pubkey(),
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &context.owner],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    // expire feature account does not exist, so its owner is the system program
    assert_instruction_error(result, InstructionError::IllegalOwner);
}

#[tokio::test]
async fn expire_token_should_fail_if_the_owner_is_not_a_signer() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to the gatekeeper network
    add_expire_feature(&mut context).await;

    let mut ix = expire_token(
        gateway_token_address,
        context.owner.pubkey(),
        context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
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

#[tokio::test]
async fn expire_token_should_fail_if_the_wrong_network_feature_address_is_passed() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to the gatekeeper network
    add_expire_feature(&mut context).await;

    let mut ix = expire_token(
        gateway_token_address,
        context.owner.pubkey(),
        context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    // set a different network feature address
    ix.accounts[2].pubkey = gateway_token_address;

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &context.owner],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::InvalidArgument);
}

#[tokio::test]
async fn expire_token_should_fail_if_the_wrong_gateway_token_address_is_passed() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to the gatekeeper network
    add_expire_feature(&mut context).await;

    let mut ix = expire_token(
        gateway_token_address,
        context.owner.pubkey(),
        context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    // set a different network feature address
    ix.accounts[0].pubkey = Pubkey::new_unique();

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &context.owner],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::IllegalOwner);
}

#[tokio::test]
async fn expire_token_should_fail_if_the_wrong_owner_is_passed() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to the gatekeeper network
    add_expire_feature(&mut context).await;

    let new_owner = Keypair::new();

    let ix = expire_token(
        gateway_token_address,
        new_owner.pubkey(),
        context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &new_owner],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(1)); // InvalidOwner
}

#[tokio::test]
async fn expire_token_should_fail_if_the_token_is_for_a_different_network() {
    let (mut context, gateway_token_address) = setup().await;

    // add the expire feature to a different gatekeeper network
    let new_gatekeeper_network = Keypair::new();
    let add_feature_tx = Transaction::new_signed_with_payer(
        &[add_feature_to_network(
            context.context.borrow().payer.pubkey(),
            new_gatekeeper_network.pubkey(),
            NetworkFeature::UserTokenExpiry,
        )],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &new_gatekeeper_network],
        context.context.borrow().last_blockhash,
    );
    context.execute_transaction(add_feature_tx).await.unwrap();

    let ix = expire_token(
        gateway_token_address,
        context.owner.pubkey(),
        new_gatekeeper_network.pubkey(),
    );

    let tx = Transaction::new_signed_with_payer(
        &[ix],
        Some(&context.context.borrow().payer.pubkey()),
        &[&context.context.borrow().payer, &context.owner],
        context.context.borrow().last_blockhash,
    );

    let result = context.execute_transaction(tx).await;

    assert_instruction_error(result, InstructionError::InvalidAccountData);
}
