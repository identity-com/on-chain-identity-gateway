// Mark this test as BPF-only due to current `ProgramTest` limitations when CPIing into the system program
#![cfg(feature = "test-bpf")]

use {
    solana_program::{
        pubkey::Pubkey,
    },
    solana_program_test::{tokio},
    solana_sdk::{
        signature::{Keypair, Signer},
    },
    solana_gateway::state::GatewayTokenState,
    crate::gateway_context::GatewayContext
};

mod gateway_context;

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = GatewayContext::new().await;

    context.create_gatekeeper_keys();
    let gatekeeper = context.add_gatekeeper().await;
    
    assert_eq!(gatekeeper.authority, context.gatekeeper_authority.unwrap().pubkey());
    assert_eq!(gatekeeper.network, context.gatekeeper_network.unwrap().pubkey());
}

#[tokio::test]
async fn add_gatekeeper_should_fail_without_gatekeeper_network_signature() {
    let mut context = GatewayContext::new().await;

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let result = context.attempt_add_gatekeeper_without_network_signature(&authority, &network.pubkey()).await;
    
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
    assert_eq!(gateway_token.issuing_gatekeeper, context.gatekeeper_authority.unwrap().pubkey());
}

#[tokio::test]
async fn set_gateway_token_revoked_should_succeed() {
    let mut context = GatewayContext::new().await;

    context.create_gatekeeper().await;

    let owner = Pubkey::new_unique();

    context.issue_gateway_token(&owner, None).await;

    // revoke the token
    let revoked_gateway_token = context.set_gateway_token_state(
        &owner,
        GatewayTokenState::Revoked
    ).await;

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
    assert!(gateway_token.expire_time.unwrap() == past);
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
    assert!(updated_gateway_token.expire_time.unwrap() == future);
}