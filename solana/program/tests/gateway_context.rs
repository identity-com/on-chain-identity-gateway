use solana_program_test::ProgramTestContext;
use solana_gateway_program::{
    instruction::add_gatekeeper,
    state::{get_gatekeeper_address_with_seed, Gatekeeper},
    instruction
};
use solana_sdk::transaction::Transaction;
use solana_sdk::transport;
use solana_sdk::signature::Keypair;
use solana_program::pubkey::Pubkey;

pub struct GatewayContext {
    pub context: ProgramTestContext
}
impl GatewayContext {
    fn new() -> Self {
        let context = program_test().start_with_context().await;
        Self {
            context
        }
    }

    async fn add_gatekeeper_transaction(
        &mut self,
        authority: &Pubkey,
        network: &Keypair,
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
    
    pub async fn add_gatekeeper(&mut self) -> Gatekeeper {
        let (gatekeeper_address, _) = get_gatekeeper_address_with_seed(&authority);
        add_gatekeeper_transaction(&authority, &network)
            .await
            .unwrap();
        let account_info = self.program_test_context
            .banks_client
            .get_account(gatekeeper_address)
            .await
            .unwrap()
            .unwrap();
        let account_data: Gatekeeper =
            program_borsh::try_from_slice_incomplete::<Gatekeeper>(&account_info.data).unwrap();
        
        account_data
    }
}