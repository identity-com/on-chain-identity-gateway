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
use solana_program::pubkey::Pubkey;
use solana_gateway::{
    borsh as program_borsh,
};
use solana_sdk::signature::Signer;

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
        network: &Keypair,
        sign_with_network: bool
    ) -> transport::Result<()> {
        let signing_keypairs: [&Keypair;2] = 
            if sign_with_network { 
                [&self.context.payer, &network]
            } else {
                [&self.context.payer, &self.context.payer]
            };
        
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::add_gatekeeper(
                &self.context.payer.pubkey(),
                authority,
                &network.pubkey(),
            )],
            Some(&self.context.payer.pubkey()),
            &signing_keypairs,
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
        self.add_gatekeeper_transaction(&authority, &network, true)
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
}