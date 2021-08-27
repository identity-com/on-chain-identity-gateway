// Mark this test as BPF-only due to current `ProgramTest` limitations when CPIing into the system program
#![cfg(feature = "test-bpf")]

use solana_gateway_program::state::{
    get_gatekeeper_address_with_seed, get_gateway_token_address_with_seed,
};
use solana_gateway_program::{id, instruction};
use solana_sdk::transaction::Transaction;
use {
    crate::gateway_context::GatewayContext,
    solana_gateway::state::GatewayTokenState,
    solana_program::pubkey::Pubkey,
    solana_program_test::tokio,
    solana_sdk::signature::{Keypair, Signer},
};

mod gateway_context;

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = GatewayContext::new().await;

    context.create_gatekeeper_keys();
    let _gatekeeper = context.add_gatekeeper().await;
}

#[tokio::test]
async fn add_gatekeeper_should_fail_without_gatekeeper_network_signature() {
    let mut context = GatewayContext::new().await;

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let result = context
        .attempt_add_gatekeeper_without_network_signature(&authority, &network.pubkey())
        .await;

    assert!(result.is_err());
}

#[tokio::test]
async fn issue_gateway_token_should_succeed() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    // now issue a gateway token as that gatekeeper
    let gateway_token = context.issue_gateway_token(&owner, None).await;

    assert_eq!(gateway_token.owner_wallet, owner);
    assert_eq!(
        gateway_token.issuing_gatekeeper,
        context.gatekeeper_authority.unwrap().pubkey()
    );
}

#[tokio::test]
async fn set_gateway_token_revoked_should_succeed() {
    let mut context = GatewayContext::new().await;

    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    context.issue_gateway_token(&owner, None).await;

    // revoke the token
    let revoked_gateway_token = context
        .set_gateway_token_state(&owner, GatewayTokenState::Revoked)
        .await;

    assert_eq!(revoked_gateway_token.state, GatewayTokenState::Revoked);
}

#[tokio::test]
async fn issue_an_expired_gateway_token_should_be_invalid() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    let past = GatewayContext::now() - 100_000;

    // issue an expired gateway token
    let gateway_token = context.issue_gateway_token(&owner, Some(past)).await;

    // we cannot use is_valid as it needs the sysvar clock which is not available here
    assert_eq!(gateway_token.expire_time.unwrap(), past);
}

#[tokio::test]
async fn update_the_expiry_of_a_gateway_token() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    let past = GatewayContext::now() - 100_000;
    let future = GatewayContext::now() + 100_000;

    // issue an expired gateway token
    context.issue_gateway_token(&owner, Some(past)).await;

    // update its expire time
    let updated_gateway_token = context.update_gateway_token_expiry(&owner, future).await;

    // we cannot use is_valid as it needs the sysvar clock which is not available here
    assert_eq!(updated_gateway_token.expire_time.unwrap(), future);
}

#[tokio::test]
async fn issue_vanilla_wrong_account_should_fail() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    context.issue_gateway_token(&owner, None).await;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();
    let (token, _) = get_gateway_token_address_with_seed(
        &owner,
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let result = context
        .issue_gateway_token_transaction(
            &owner,
            &authority,
            &token,
            &context.gatekeeper_network.as_ref().unwrap().pubkey(),
            None,
        )
        .await;

    assert!(result.is_err());
}

#[tokio::test]
async fn set_state_wrong_account_type_should_fail() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    context.issue_gateway_token(&owner, None).await;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();
    let (token, _) = get_gateway_token_address_with_seed(
        &owner,
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let result = context
        .set_gateway_token_state_transaction(
            &gatekeeper_account,
            &authority,
            &gatekeeper_account,
            GatewayTokenState::Revoked,
        )
        .await;

    assert!(result.is_err());

    let result = context
        .set_gateway_token_state_transaction(&token, &authority, &token, GatewayTokenState::Revoked)
        .await;

    assert!(result.is_err());
}

#[tokio::test]
async fn remove_gatekeeper_account_should_succeed() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let (gatekeeper_address, _) = get_gatekeeper_address_with_seed(
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    let account = context
        .context
        .banks_client
        .get_account(gatekeeper_address)
        .await
        .unwrap()
        .unwrap();

    assert_eq!(account.owner, id());

    let funds_to = context.remove_gatekeeper().await;

    assert_eq!(
        context
            .context
            .banks_client
            .get_account(gatekeeper_address)
            .await
            .unwrap(),
        None
    );
    assert_eq!(
        context
            .context
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
async fn update_expiry_wrong_account_should_fail() {
    let mut context = GatewayContext::new().await;
    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    context.issue_gateway_token(&owner, None).await;

    let authority =
        Keypair::from_bytes(&context.gatekeeper_authority.as_ref().unwrap().to_bytes()).unwrap();
    let (token, _) = get_gateway_token_address_with_seed(
        &owner,
        &None,
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );
    let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
        &context.gatekeeper_authority.as_ref().unwrap().pubkey(),
        &context.gatekeeper_network.as_ref().unwrap().pubkey(),
    );

    let result = {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &gatekeeper_account,
                &authority.pubkey(),
                &gatekeeper_account,
                10,
            )],
            Some(&context.context.payer.pubkey()),
            &[&context.context.payer, &authority],
            context.context.last_blockhash,
        );

        context
            .context
            .banks_client
            .process_transaction(transaction)
            .await
    };

    assert!(result.is_err());

    let result = {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &token,
                &authority.pubkey(),
                &token,
                10,
            )],
            Some(&context.context.payer.pubkey()),
            &[&context.context.payer, &authority],
            context.context.last_blockhash,
        );

        context
            .context
            .banks_client
            .process_transaction(transaction)
            .await
    };

    assert!(result.is_err());
}
