use clap::Clap;
use debug_print::debug_println;
use rand::rngs::OsRng;
use solana_client::{
    rpc_client::RpcClient,
    rpc_config::RpcSendTransactionConfig,
    client_error::ClientError
};
use solana_gateway_program::solana_program::program_error::ProgramError;
use solana_gateway_program::instruction;
use solana_sdk::{
    transaction::Transaction,
    signature::Signature,
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    commitment_config::CommitmentConfig
};

#[derive(Clap, Debug)]
pub enum Command {
    WholeShebang {
        payer: String,
        gateway_program_id: Pubkey,
    },
}

#[derive(Clap, Debug)]
pub struct Opts {
    #[clap(subcommand)]
    pub command: Command,
    #[clap(default_value = "http://localhost:8899")]
    pub cluster_url: String,
}

impl Opts {
    fn client(&self) -> RpcClient {
        RpcClient::new(self.cluster_url.to_string())
    }
}

pub fn start(opts: Opts) -> Result<(), ClientError> {
    let client = opts.client();

    match opts.command {
        Command::WholeShebang {
            ref gateway_program_id,
            ref payer,
        } => {
            let payer = read_keypair_file(payer).unwrap();
            whole_shebang(&client, gateway_program_id, &payer)?;
        }
    }
    Ok(())
}

pub fn send_txn(client: &RpcClient, txn: &Transaction) -> Result<Signature, ClientError> {
    Ok(client.send_and_confirm_transaction_with_spinner_and_config(
        txn,
        CommitmentConfig::confirmed(),
        RpcSendTransactionConfig {
            skip_preflight: true,
            ..RpcSendTransactionConfig::default()
        },
    )?)
}

fn whole_shebang(client: &RpcClient, program_id: &Pubkey, payer: &Keypair) -> Result<(), ClientError> {
    let gatekeeper = Keypair::generate(&mut OsRng);
    let gatekeeper_network = Keypair::generate(&mut OsRng);

    let add_gatekeeper_instruction = instruction::add_gatekeeper(
        &payer.pubkey(),
        &gatekeeper.pubkey(),
        &gatekeeper_network.pubkey(),
    );
    let instructions = vec![add_gatekeeper_instruction];

    let (recent_hash, _fee_calc) = client.get_recent_blockhash()?;
    let signers = vec![payer, &gatekeeper_network];
    let txn = Transaction::new_signed_with_payer(
        &instructions,
        Some(&payer.pubkey()),
        &signers,
        recent_hash,
    );

    debug_println!("Sending the ol' transaction");
    send_txn(client, &txn)?;
    debug_println!("The ol' transaction was sent");
    
    Ok(())
}