use solana_gateway::borsh as program_borsh;
use solana_gateway::state::{GatewayToken, GatewayTokenState};
use solana_gateway_program::{
    id, instruction, instruction::GatewayInstruction, processor::process_instruction,
    state::get_gatekeeper_address_with_seed, state::get_gateway_token_address_with_seed,
};
use solana_program::{pubkey::Pubkey, system_program, sysvar};
use solana_program_test::{processor, ProgramTest, ProgramTestContext};
use solana_sdk::{
    clock::UnixTimestamp,
    instruction::{AccountMeta, Instruction},
    signature::Keypair,
    signature::Signer,
    transaction::Transaction,
    transport,
};
use std::time::{SystemTime, UNIX_EPOCH};

fn program_test() -> ProgramTest {
    ProgramTest::new(
        "solana_gateway_program",
        id(),
        processor!(process_instruction),
    )
}

pub struct GatewayContext {
    pub context: ProgramTestContext,
    pub gatekeeper_authority: Option<Keypair>,
    pub gatekeeper_network: Option<Keypair>,
}
impl GatewayContext {
    // Get the current unix timestamp from SystemTime
    pub fn now() -> UnixTimestamp {
        let start = SystemTime::now();
        let now = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");

        now.as_secs() as UnixTimestamp
    }

    pub async fn new() -> Self {
        let context = program_test().start_with_context().await;
        Self {
            context,
            gatekeeper_network: None,
            gatekeeper_authority: None,
        }
    }

    pub fn create_gatekeeper_keys(&mut self) {
        let gatekeeper_authority = Keypair::new();
        let gatekeeper_network = Keypair::new();

        self.gatekeeper_authority = Some(gatekeeper_authority);
        self.gatekeeper_network = Some(gatekeeper_network);
    }

    pub async fn create_gatekeeper(&mut self) {
        self.create_gatekeeper_keys();

        // first add the gatekeeper to the network
        self.add_gatekeeper().await;
    }

    /// Returns funds_to
    pub async fn remove_gatekeeper(&mut self) -> Pubkey {
        let funds_to = Keypair::new().pubkey();
        assert!(self
            .context
            .banks_client
            .get_account(funds_to)
            .await
            .unwrap()
            .map(|account| account.lamports == 0)
            .unwrap_or(true));

        let transaction = Transaction::new_signed_with_payer(
            &[instruction::remove_gatekeeper(
                &funds_to,
                &self.gatekeeper_authority.as_ref().unwrap().pubkey(),
                &self.gatekeeper_network.as_ref().unwrap().pubkey(),
            )],
            Some(&self.context.payer.pubkey()),
            &[
                &self.context.payer,
                self.gatekeeper_network.as_ref().unwrap(),
            ],
            self.context.last_blockhash,
        );

        self.context
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        funds_to
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
            &[&self.context.payer, network],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn issue_gateway_token_transaction(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        network: &Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> transport::Result<()> {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::issue_vanilla(
                &self.context.payer.pubkey(),
                owner,
                gatekeeper_account,
                &gatekeeper_authority.pubkey(),
                network,
                None,
                expire_time,
            )],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, gatekeeper_authority],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn update_gateway_token_expiry_transaction(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        expire_time: UnixTimestamp,
    ) -> transport::Result<()> {
        let (gateway_token, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &gateway_token,
                &gatekeeper_authority.pubkey(),
                gatekeeper_account,
                expire_time,
            )],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, gatekeeper_authority],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn set_gateway_token_state_transaction(
        &mut self,
        gateway_account: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        gateway_token_state: GatewayTokenState,
    ) -> transport::Result<()> {
        let transaction = Transaction::new_signed_with_payer(
            &[instruction::set_state(
                gateway_account,
                &gatekeeper_authority.pubkey(),
                gatekeeper_account,
                gateway_token_state,
            )],
            Some(&self.context.payer.pubkey()),
            &[&self.context.payer, gatekeeper_authority],
            self.context.last_blockhash,
        );
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn attempt_add_gatekeeper_without_network_signature(
        &mut self,
        authority: &Pubkey,
        network: &Pubkey,
    ) -> transport::Result<()> {
        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(authority, network);
        // create an instruction that doesn't require the network signature.
        let instruction = Instruction::new_with_borsh(
            id(),
            &GatewayInstruction::AddGatekeeper {},
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
        self.context
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn add_gatekeeper(&mut self) -> Pubkey {
        // TODO find nicer way to clone a Keypair to fix borrowing issues
        let gatekeeper_network = Keypair::from_base58_string(
            self.gatekeeper_network
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );
        let gatekeeper_authority = Keypair::from_base58_string(
            self.gatekeeper_authority
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );

        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
            &gatekeeper_authority.pubkey(),
            &gatekeeper_network.pubkey(),
        );
        self.add_gatekeeper_transaction(&gatekeeper_authority.pubkey(), &gatekeeper_network)
            .await
            .unwrap();

        gatekeeper_account
    }

    async fn get_gateway_token(&mut self, owner: &Pubkey) -> Option<GatewayToken> {
        let (gateway_token, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        self.context
            .banks_client
            .get_account(gateway_token)
            .await
            .unwrap()
            .map(|account_info| {
                program_borsh::try_from_slice_incomplete::<GatewayToken>(&account_info.data)
                    .unwrap()
            })
    }

    pub async fn issue_gateway_token(
        &mut self,
        owner: &Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> GatewayToken {
        // TODO find nicer way to clone a Keypair to fix borrowing issues
        let gatekeeper_network = Keypair::from_base58_string(
            self.gatekeeper_network
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );
        let gatekeeper_authority = Keypair::from_base58_string(
            self.gatekeeper_authority
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );

        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
            &gatekeeper_authority.pubkey(),
            &gatekeeper_network.pubkey(),
        );
        self.issue_gateway_token_transaction(
            owner,
            &gatekeeper_authority,
            &gatekeeper_account,
            &gatekeeper_network.pubkey(),
            expire_time,
        )
        .await
        .unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }

    pub async fn update_gateway_token_expiry(
        &mut self,
        owner: &Pubkey,
        expire_time: UnixTimestamp,
    ) -> GatewayToken {
        // TODO find nicer way to clone a Keypair to fix borrowing issues
        let gatekeeper_authority = Keypair::from_base58_string(
            self.gatekeeper_authority
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );
        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
            &gatekeeper_authority.pubkey(),
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );

        self.update_gateway_token_expiry_transaction(
            owner,
            &gatekeeper_authority,
            &gatekeeper_account,
            expire_time,
        )
        .await
        .unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }

    pub async fn set_gateway_token_state(
        &mut self,
        owner: &Pubkey,
        gateway_token_state: GatewayTokenState,
    ) -> GatewayToken {
        // TODO find nicer way to clone a Keypair to fix borrowing issues
        let gatekeeper_authority = Keypair::from_base58_string(
            self.gatekeeper_authority
                .as_ref()
                .unwrap()
                .to_base58_string()
                .as_str(),
        );
        let (gatekeeper_account, _) = get_gatekeeper_address_with_seed(
            &gatekeeper_authority.pubkey(),
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        let (gateway_account, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        self.set_gateway_token_state_transaction(
            &gateway_account,
            &gatekeeper_authority,
            &gatekeeper_account,
            gateway_token_state,
        )
        .await
        .unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }
}
