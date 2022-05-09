use cruiser::client::{ConfirmationResult, TransactionBuilder};
use cruiser::prelude::*;
use cruiser::solana_client::client_error::reqwest::Client;
use cruiser::solana_client::nonblocking::rpc_client::RpcClient;
use cruiser::solana_client::rpc_config::{RpcSendTransactionConfig, RpcTransactionConfig};
use cruiser::solana_sdk::commitment_config::{CommitmentConfig, CommitmentLevel};
use cruiser::solana_sdk::native_token::LAMPORTS_PER_SOL;
use futures::executor::block_on;
use futures::select_biased;
use futures::FutureExt;
use gateway_program_v2::instructions::client::create_network;
use gateway_program_v2::instructions::CreateNetworkData;
use std::error::Error;
use std::panic;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tokio::process::Command;
use tokio::sync::Mutex;
use tokio::time::sleep;

#[tokio::test]
async fn create_network_test() -> Result<(), Box<dyn Error>> {
    let deploy_dir = Path::new(env!("CARGO_TARGET_TMPDIR"))
        .parent()
        .unwrap()
        .join("deploy");
    let build = Command::new("cargo")
        .env("RUSTFLAGS", "-D warnings")
        .arg("build-bpf")
        .arg("--workspace")
        .arg("--")
        .arg("-p")
        .arg("gateway_program_v2")
        .spawn()?
        .wait()
        .await?;
    if !build.success() {
        return Err(build.to_string().into());
    }
    let program_id = Keypair::new().pubkey();
    println!("Program ID: `{}`", program_id);

    let mut local_validator = Command::new("solana-test-validator");
    local_validator
        .arg("-r")
        .arg("--bpf-program")
        .arg(program_id.to_string())
        .arg(deploy_dir.join("gateway_program_v2.so"))
        .arg("--deactivate-feature")
        .arg("5ekBxc8itEnPv4NzGJtr8BVVQLNMQuLMNQQj7pHoLNZ9") // transaction wide compute cap
        .arg("--deactivate-feature")
        .arg("75m6ysz33AfLA5DDEzWM1obBrnPQRSsdVQ2nRmc8Vuu1") // support account data reallocation
        .arg("--ledger")
        .arg(Path::new(env!("CARGO_TARGET_TMPDIR")).join("test_ledger_8899"));
    println!("Running {:?}", local_validator);
    let local_validator = Arc::new(Mutex::new(local_validator.spawn()?));

    let local_validator_clone = local_validator.clone();
    let hook = panic::take_hook();
    panic::set_hook(Box::new(move |panic_info| {
        println!("{}", panic_info);
        let local_validator = local_validator_clone.lock();
        if let Err(error) = block_on(async move { local_validator.await.kill().await }) {
            eprintln!("Error killing validator: {}", error);
        }
        hook(panic_info);
    }));

    let test_func = {
        let local_validator = local_validator.clone();
        async move {
            let run_local_validator = async {
                let client = Client::new();
                loop {
                    if let Some(exit_status) = local_validator.lock().await.try_wait()? {
                        return Result::<_, Box<dyn Error>>::Err(
                            format!("Local validator exited early: {}", exit_status).into(),
                        );
                    }
                    if client
                        .get("http://localhost:8899/health")
                        .send()
                        .await
                        .map_or(false, |res| res.status().is_success())
                    {
                        break;
                    }
                    sleep(Duration::from_millis(500)).await;
                }
                Ok(())
            };
            (select_biased! {
                res = run_local_validator.fuse() => res,
                _ = sleep(Duration::from_secs(5)).fuse() => Err("Local Validator Timed out!".into())
            })?;

            let rpc = RpcClient::new_with_commitment(
                "http://localhost:8899".to_string(),
                CommitmentConfig::confirmed(),
            );

            let funder = Keypair::new();
            let blockhash = rpc.get_latest_blockhash().await?;
            let sig = rpc
                .request_airdrop_with_blockhash(&funder.pubkey(), LAMPORTS_PER_SOL, &blockhash)
                .await?;
            rpc.confirm_transaction_with_spinner(&sig, &blockhash, CommitmentConfig::confirmed())
                .await?;

            let network = Keypair::new();
            let (sig, result) = TransactionBuilder::new(&funder)
                .signed_instructions(create_network(
                    &program_id,
                    network,
                    Some(&funder),
                    CreateNetworkData {
                        auth_threshold: 1,
                        pass_expire_time: 60 * 60,
                        network_data_len: 16,
                        signer_bump: 3,
                        fees: Default::default(),
                        auth_keys: Default::default(),
                    },
                ))
                .send_and_confirm_transaction(
                    &rpc,
                    RpcSendTransactionConfig {
                        skip_preflight: false,
                        preflight_commitment: Some(CommitmentLevel::Confirmed),
                        encoding: None,
                        max_retries: None,
                    },
                    CommitmentConfig::confirmed(),
                    Duration::from_millis(500),
                )
                .await?;

            match result {
                ConfirmationResult::Success => {}
                ConfirmationResult::Failure(error) => return Err(error.into()),
                ConfirmationResult::Dropped => return Err("Transaction dropped".into()),
            }

            println!(
                "Initialize logs: {:#?}",
                rpc.get_transaction_with_config(
                    &sig,
                    RpcTransactionConfig {
                        encoding: None,
                        commitment: Some(CommitmentConfig::confirmed()),
                        max_supported_transaction_version: None
                    }
                )
                .await?
                .transaction
                .meta
                .unwrap()
                .log_messages
            );
            Result::<(), Box<dyn Error>>::Ok(())
        }
    };

    let out = test_func.await;

    let mut local = local_validator.lock().await;
    local.start_kill()?;
    local.wait().await?;

    out
}
