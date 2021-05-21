use solana_program_test::{ProgramTestContext, ProgramTest, processor};
use solana_gateway_program::{
    state::{get_gatekeeper_address_with_seed, Gatekeeper},
    id, instruction,
    processor::process_instruction
};
use solana_sdk::{
    transport,
    transaction::Transaction,
    signature::Keypair
};
use solana_program::{
    pubkey::Pubkey,
    sysvar,system_program
};
use solana_gateway::{
    borsh as program_borsh,
};
use solana_sdk::signature::Signer;
use solana_sdk::instruction::{AccountMeta, Instruction};
use solana_gateway_program::instruction::GatewayInstruction;
use solana_gateway::state::GatewayToken;
use solana_gateway_program::state::get_gateway_token_address_with_seed;

fn program_test() -> ProgramTest {
    ProgramTest::new("solana_gateway_program", id(), processor!(process_instruction))
}

pub struct GatewayContext {
    pub context: ProgramTestContext
}
impl GatewayContext {
    pub async fn new() -> Self {
        let context = program_test().start_with_context().await;
        Self {
            context
        }
    }

    async fn add_gatekeeper_transaction(
        &mut self,
        authority: &Pubkey,
        network: &Keypair
    ) -> transport::Result<()> {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::add_gatekeeper(
                &self.context.payer.pubkey(),
                authority,
                &network.pubkey(),
            )],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &network],
            self.context.last_blockhash,
        );
        self.context.banks_client.process_transaction(transaction).await
    }

    async fn issue_gateway_transaction(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        network: &Pubkey,
    ) -> transport::Result<()> {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::issue_vanilla(
                &self.context.payer.pubkey(),
                owner,
                gatekeeper_account,
                &gatekeeper_authority.pubkey(),
                &network,
                None
            )],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, &gatekeeper_authority],
            self.context.last_blockhash,
        );
        self.context.banks_client.process_transaction(transaction).await
    }

    pub async fn attempt_add_gatekeeper_without_network_signature(
        &mut self,
        authority: &Pubkey,
        network: &Pubkey,
    ) -> transport::Result<()> {
        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(authority);
        // create an instruction that doesn't require the network signature.
        let instruction = Instruction::new_with_borsh(
            id(),
            &GatewayInstruction::AddGatekeeper { },
            vec![
                AccountMeta::new(self.context.payer.pubkey(), true),
                AccountMeta::new(gatekeeper_account, false),
                AccountMeta::new_readonly(*authority, false),
                AccountMeta::new_readonly(*network, false),
                AccountMeta::new_readonly(sysvar::rent::id(), false),
                AccountMeta::new_readonly(system_program::id(), false),
            ],
        );
        
        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer],
            self.context.last_blockhash,
        );
        self.context.banks_client.process_transaction(transaction).await
    }

    pub async fn add_gatekeeper(
        &mut self,
        authority: &Pubkey,
        network: &Keypair,
    ) -> Gatekeeper {
        let (gatekeeper_address, _) = get_gatekeeper_address_with_seed(&authority);
        self.add_gatekeeper_transaction(&authority, &network)
            .await
            .unwrap();
        let account_info = self.context
            .banks_client
            .get_account(gatekeeper_address)
            .await
            .unwrap()
            .unwrap();
        let account_data: Gatekeeper =
            program_borsh::try_from_slice_incomplete::<Gatekeeper>(&account_info.data).unwrap();

        account_data
    }

    pub async fn issue_gateway_token(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        network: &Pubkey,
    ) -> GatewayToken {
        let (gatekeeper_address, _) = get_gatekeeper_address_with_seed(&gatekeeper_authority.pubkey());
        let (gateway_account, _) = get_gateway_token_address_with_seed(&owner, &None);
        self.issue_gateway_transaction(&owner, gatekeeper_authority, &gatekeeper_address, network)
            .await
            .unwrap();

        let account_info = self.context
            .banks_client
            .get_account(gateway_account)
            .await
            .unwrap()
            .unwrap();
        let account_data: GatewayToken =
            program_borsh::try_from_slice_incomplete::<GatewayToken>(&account_info.data).unwrap();

        account_data
    }
}