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
