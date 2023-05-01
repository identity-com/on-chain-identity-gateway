#![cfg(feature = "test-sbf")]

mod common;

use common::util::{assert_instruction_error, clone_keypair};
use solana_gateway_program::instruction;
use solana_gateway_program::state::get_gatekeeper_account_address;
use solana_program::instruction::InstructionError::Custom;
use solana_sdk::signature::Signer;
use {common::gateway_context::GatewayContext, solana_program_test::tokio};

async fn setup() -> (GatewayContext, GatewayContext) {
    let mut context1 = GatewayContext::new().await;
    context1.create_gatekeeper().await;

    let mut context2 = GatewayContext::new_shared_test_context(&context1.context).await;
    context2.create_gatekeeper().await;

    (context1, context2)
}

#[tokio::test]
async fn issue_in_one_network_not_found_in_other() {
    let (mut context1, mut context2) = setup().await;

    context1
        .issue_gateway_token(&context1.owner.pubkey(), None)
        .await;

    let gt_option = context2.get_gateway_token(&context2.owner.pubkey()).await;
    assert!(gt_option.is_none());
}

#[tokio::test]
async fn issue_for_same_owner_in_both_networks() {
    let (mut context1, mut context2) = setup().await;

    let owner = context1.owner.pubkey();

    context1.issue_gateway_token(&owner, None).await;

    context2.issue_gateway_token(&owner, None).await;
}

#[tokio::test]
async fn gatekeeper_in_network_1_cannot_issue_in_network_2() {
    let (mut context1, context2) = setup().await;

    let tx = context1.issue_gateway_token_detailed(
        &context1.owner.pubkey(),
        context2.gatekeeper_authority.as_ref().unwrap(), // wrong gatekeeper for context1
        &context2.gatekeeper_account.unwrap(),
        &context1.gatekeeper_network.as_ref().unwrap().pubkey(),
        None,
    );

    let result = context1.execute_transaction(tx).await;

    assert_instruction_error(result, Custom(0)); // IncorrectGatekeeper
}

#[tokio::test]
async fn gatekeeper_in_both_networks_can_issue_two_passes() {
    let (mut context1, mut context2) = setup().await;

    let owner = context1.owner.pubkey();

    // add authority 1 to network 2
    let authority_1 = clone_keypair(context1.gatekeeper_authority.as_ref().unwrap());
    let network_2 = clone_keypair(context2.gatekeeper_network.as_ref().unwrap());
    let tx = context2.add_gatekeeper_transaction(&authority_1.pubkey(), &network_2);
    context2.execute_transaction(tx).await.unwrap();

    // issue a pass in network 1
    let issue_tx_1 = context1.issue_gateway_token_detailed(
        &owner,
        &authority_1,
        &context1.gatekeeper_account.unwrap(),
        &context1.gatekeeper_network.as_ref().unwrap().pubkey(),
        None,
    );
    context1.execute_transaction(issue_tx_1).await.unwrap();

    // issue a pass in network 2
    let gatekeeper_account_2 =
        get_gatekeeper_account_address(&authority_1.pubkey(), &network_2.pubkey()).0;
    let issue_tx_2 = context1.issue_gateway_token_detailed(
        &owner,
        &authority_1,
        &gatekeeper_account_2,
        &context2.gatekeeper_network.as_ref().unwrap().pubkey(),
        None,
    );
    context2.execute_transaction(issue_tx_2).await.unwrap();
}
