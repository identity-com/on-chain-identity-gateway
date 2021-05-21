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
    crate::gateway_context::GatewayContext
};
use solana_gateway::state::GatewayTokenState;

mod gateway_context;

#[tokio::test]
async fn add_gatekeeper_should_succeed() {
    let mut context = GatewayContext::new().await;

    let authority = Pubkey::new_unique();
    let network = Keypair::new();
    let gatekeeper = context.add_gatekeeper(&authority, &network).await;
    
    assert_eq!(gatekeeper.authority, authority);
    assert_eq!(gatekeeper.network, network.pubkey());
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
    
    let owner = Pubkey::new_unique();
    let authority = Keypair::new();
    let network = Keypair::new();
    
    // first add the gatekeeper to the network
    context.add_gatekeeper(&authority.pubkey(), &network).await;
    
    // now issue a gateway token as that gatekeeper
    let gateway_token = context.issue_gateway_token(&owner, &authority, &network.pubkey()).await;

    assert_eq!(gateway_token.owner_wallet, owner);
    assert_eq!(gateway_token.issuing_gatekeeper, authority.pubkey());
    assert_eq!(gateway_token.state, GatewayTokenState::Active);
}

#[tokio::test]
async fn set_gateway_token_revoked_should_succeed() {
    let mut context = GatewayContext::new().await;

    let owner = Pubkey::new_unique();
    let authority = Keypair::new();
    let network = Keypair::new();

    // first add the gatekeeper to the network
    context.add_gatekeeper(&authority.pubkey(), &network).await;

    // now issue a gateway token as that gatekeeper
    context.issue_gateway_token(&owner, &authority, &network.pubkey()).await;

    // finally revoke the token
    let revoked_gateway_token = context.set_gateway_token_state(&owner,
                                                                &authority,
                                                                GatewayTokenState::Revoked).await;

    assert_eq!(revoked_gateway_token.state, GatewayTokenState::Revoked);
}
