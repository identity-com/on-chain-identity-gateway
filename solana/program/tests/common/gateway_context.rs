// Required for clippy in tests. https://github.com/rust-lang/rust/issues/46379#issuecomment-487421236
#![allow(dead_code)]
#![allow(clippy::await_holding_refcell_ref)]

use super::util::clone_keypair;
use crate::instruction::GatewayInstruction;
use solana_gateway_program::borsh::try_from_slice_incomplete;
use solana_gateway_program::processor::process_instruction;
use solana_gateway_program::state::{
    get_gatekeeper_account_address, get_gateway_token_address_with_seed, GatewayToken,
    GatewayTokenState,
};
use solana_gateway_program::{instruction, Gateway};
use solana_program::{pubkey::Pubkey, system_program};
use solana_program_test::{processor, BanksClientError, ProgramTest, ProgramTestContext};
use solana_sdk::{
    clock::UnixTimestamp,
    instruction::{AccountMeta, Instruction},
    signature::Keypair,
    signature::Signer,
    transaction::Transaction,
};
use std::cell::RefCell;
use std::rc::Rc;
use std::time::{SystemTime, UNIX_EPOCH};

fn program_test() -> ProgramTest {
    ProgramTest::new(
        "solana_gateway_program",
        Gateway::program_id(),
        processor!(process_instruction),
    )
}

pub struct GatewayContext {
    pub context: Rc<RefCell<ProgramTestContext>>,
    pub gatekeeper_authority: Option<Keypair>,
    pub gatekeeper_network: Option<Keypair>,
    pub gatekeeper_account: Option<Pubkey>,
    pub owner: Keypair,
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
            context: Rc::new(RefCell::new(context)),
            gatekeeper_network: None,
            gatekeeper_authority: None,
            gatekeeper_account: None,
            owner: Keypair::new(),
        }
    }

    pub async fn new_shared_test_context(
        program_test_context: &Rc<RefCell<ProgramTestContext>>,
    ) -> Self {
        Self {
            context: program_test_context.clone(),
            gatekeeper_network: None,
            gatekeeper_authority: None,
            gatekeeper_account: None,
            owner: Keypair::new(),
        }
    }

    pub fn create_gatekeeper_keys(&mut self) {
        let gatekeeper_authority = Keypair::new();
        let gatekeeper_network = Keypair::new();

        self.gatekeeper_account = Some(
            get_gatekeeper_account_address(
                &gatekeeper_authority.pubkey(),
                &gatekeeper_network.pubkey(),
            )
            .0,
        );
        self.gatekeeper_authority = Some(gatekeeper_authority);
        self.gatekeeper_network = Some(gatekeeper_network);
    }

    pub async fn create_gatekeeper(&mut self) {
        self.create_gatekeeper_keys();

        // first add the gatekeeper to the network
        self.add_gatekeeper().await;
    }

    pub async fn execute_transaction(
        &mut self,
        transaction: Transaction,
    ) -> Result<(), BanksClientError> {
        self.context
            .borrow_mut()
            .banks_client
            .process_transaction(transaction)
            .await
    }

    /// Returns funds_to
    pub async fn remove_gatekeeper(&mut self) -> Pubkey {
        let funds_to = Keypair::new().pubkey();
        assert!(self
            .context
            .borrow_mut()
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
            Some(&self.context.borrow().payer.pubkey()),
            &[
                &self.context.borrow().payer,
                self.gatekeeper_network.as_ref().unwrap(),
            ],
            self.context.borrow().last_blockhash,
        );

        self.context
            .borrow_mut()
            .banks_client
            .process_transaction(transaction)
            .await
            .unwrap();

        funds_to
    }

    pub fn add_gatekeeper_transaction(
        &mut self,
        authority: &Pubkey,
        network: &Keypair,
    ) -> Transaction {
        Transaction::new_signed_with_payer(
            &[instruction::add_gatekeeper(
                &self.context.borrow().payer.pubkey(),
                authority,
                &network.pubkey(),
            )],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer, network],
            self.context.borrow().last_blockhash,
        )
    }

    pub fn issue_gateway_token_detailed(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        network: &Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> Transaction {
        Transaction::new_signed_with_payer(
            &[instruction::issue(
                &self.context.borrow().payer.pubkey(),
                owner,
                gatekeeper_account,
                &gatekeeper_authority.pubkey(),
                network,
                None,
                expire_time,
            )],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer, gatekeeper_authority],
            self.context.borrow().last_blockhash,
        )
    }

    pub fn update_gateway_token_expiry_transaction(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        expire_time: UnixTimestamp,
    ) -> Transaction {
        let (gateway_token, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        Transaction::new_signed_with_payer(
            &[instruction::update_expiry(
                &gateway_token,
                &gatekeeper_authority.pubkey(),
                gatekeeper_account,
                expire_time,
            )],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer, gatekeeper_authority],
            self.context.borrow().last_blockhash,
        )
    }

    pub fn set_gateway_token_state_detailed(
        &mut self,
        gateway_token: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        gateway_token_state: GatewayTokenState,
    ) -> Transaction {
        Transaction::new_signed_with_payer(
            &[instruction::set_state(
                gateway_token,
                &gatekeeper_authority.pubkey(),
                gatekeeper_account,
                gateway_token_state,
            )],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer, gatekeeper_authority],
            self.context.borrow().last_blockhash,
        )
    }

    pub fn burn_gateway_token_transaction(
        &mut self,
        owner: &Pubkey,
        gatekeeper_authority: &Keypair,
        gatekeeper_account: &Pubkey,
        recipient: &Pubkey,
    ) -> Transaction {
        let (gateway_token, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        Transaction::new_signed_with_payer(
            &[instruction::burn_token(
                &gateway_token,
                &gatekeeper_authority.pubkey(),
                gatekeeper_account,
                recipient,
            )],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer, gatekeeper_authority],
            self.context.borrow().last_blockhash,
        )
    }

    pub async fn attempt_add_gatekeeper_without_network_signature(
        &mut self,
        authority: &Pubkey,
        network: &Pubkey,
    ) -> Result<(), BanksClientError> {
        // create an instruction that doesn't require the network signature.
        let instruction = Instruction::new_with_borsh(
            Gateway::program_id(),
            &GatewayInstruction::AddGatekeeper {},
            vec![
                AccountMeta::new(self.context.borrow().payer.pubkey(), true),
                AccountMeta::new(self.gatekeeper_account.unwrap(), false),
                AccountMeta::new_readonly(*authority, false),
                AccountMeta::new_readonly(*network, false),
                AccountMeta::new_readonly(system_program::id(), false),
            ],
        );

        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.context.borrow().payer.pubkey()),
            &[&self.context.borrow().payer],
            self.context.borrow().last_blockhash,
        );
        self.context
            .borrow_mut()
            .banks_client
            .process_transaction(transaction)
            .await
    }

    pub async fn add_gatekeeper(&mut self) -> Pubkey {
        let authority = &self.gatekeeper_authority.as_ref().unwrap().pubkey();
        let network = clone_keypair(self.gatekeeper_network.as_ref().unwrap());

        let tx = self.add_gatekeeper_transaction(authority, &network);

        self.execute_transaction(tx).await.unwrap();

        self.gatekeeper_account.unwrap()
    }

    pub async fn get_gateway_token(&mut self, owner: &Pubkey) -> Option<GatewayToken> {
        let (gateway_token, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        let account_info = self
            .context
            .borrow_mut()
            .banks_client
            .get_account(gateway_token)
            .await
            .unwrap();

        match account_info {
            Some(account_info) => {
                let gateway_token =
                    try_from_slice_incomplete::<GatewayToken>(&account_info.data).unwrap();
                Some(gateway_token)
            }
            None => None,
        }
    }

    pub async fn issue_gateway_token(
        &mut self,
        owner: &Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> GatewayToken {
        let tx = self.issue_gateway_token_transaction(owner, expire_time);

        self.execute_transaction(tx).await.unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }

    pub fn issue_gateway_token_transaction(
        &mut self,
        owner: &Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> Transaction {
        let authority = clone_keypair(self.gatekeeper_authority.as_ref().unwrap());
        let network = &self.gatekeeper_network.as_ref().unwrap().pubkey();

        self.issue_gateway_token_detailed(
            owner,
            &authority,
            &self.gatekeeper_account.unwrap(),
            network,
            expire_time,
        )
    }

    pub async fn update_gateway_token_expiry(
        &mut self,
        owner: &Pubkey,
        expire_time: UnixTimestamp,
    ) -> GatewayToken {
        let gatekeeper_authority = clone_keypair(self.gatekeeper_authority.as_ref().unwrap());

        let tx = self.update_gateway_token_expiry_transaction(
            owner,
            &gatekeeper_authority,
            &self.gatekeeper_account.unwrap(),
            expire_time,
        );

        self.execute_transaction(tx).await.unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }

    pub async fn burn_gateway_token(&mut self, owner: &Pubkey) {
        let gatekeeper_authority = clone_keypair(self.gatekeeper_authority.as_ref().unwrap());

        let tx = self.burn_gateway_token_transaction(
            owner,
            &gatekeeper_authority,
            &self.gatekeeper_account.unwrap(),
            &gatekeeper_authority.pubkey(),
        );

        self.execute_transaction(tx).await.unwrap();
    }

    pub async fn set_gateway_token_state(
        &mut self,
        owner: &Pubkey,
        gateway_token_state: GatewayTokenState,
    ) -> GatewayToken {
        let tx = self.set_gateway_token_state_transaction(owner, gateway_token_state);

        self.execute_transaction(tx).await.unwrap();

        let account_data = self.get_gateway_token(owner).await;

        account_data.unwrap()
    }

    pub fn set_gateway_token_state_transaction(
        &mut self,
        owner: &Pubkey,
        gateway_token_state: GatewayTokenState,
    ) -> Transaction {
        let gatekeeper_authority = clone_keypair(self.gatekeeper_authority.as_ref().unwrap());
        let (gateway_account, _) = get_gateway_token_address_with_seed(
            owner,
            &None,
            &self.gatekeeper_network.as_ref().unwrap().pubkey(),
        );
        self.set_gateway_token_state_detailed(
            &gateway_account,
            &gatekeeper_authority,
            &self.gatekeeper_account.unwrap(),
            gateway_token_state,
        )
    }
}
