#![warn(
    unused_import_braces,
    unused_imports,
    // missing_docs,
    missing_debug_implementations,
    clippy::pedantic
)]
#![allow(
    clippy::cast_possible_truncation,
    clippy::module_name_repetitions,
    clippy::missing_errors_doc,
    clippy::too_many_lines,
    clippy::mut_mut,
    clippy::wildcard_imports
)]

use anchor_lang::prelude::*;
use crate::account::{GatekeeperNetwork, NetworkAuthKey};

declare_id!("9aYjKhEJd3ZoGe1TWASXw645gexZfLeQcm6W8vgF7BxH");

pub mod account;
pub mod instructions;
pub mod types;
pub mod util;

use crate::account::*;
use crate::instructions::Network;
use crate::types::NetworkFees;
use crate::types::NetworkKeyFlags;

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(ctx: Context<CreateNetwork>, data: CreateNetworkData) -> Result<()> {
        Network::create(data, &mut ctx.accounts.network)
    }

    pub fn update_network(ctx: Context<UpdateNetwork>, data: UpdateNetworkData) -> Result<()> {
        Network::update(data, &mut ctx.accounts.network)
    }
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct UpdateNetwork<'info> {
    #[account(
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    // pub system_program: Program<'info, System>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetwork<'info> {
    #[account(
        init,
        payer = payer,
        space = GatekeeperNetwork::on_chain_size_with_arg(
            GatekeeperNetworkSize{
                fees_count: data.fees.len() as u16,
                auth_keys: data.auth_keys.len() as u16,
            }
        ),
    )]
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// /// Accounts for [`CreateNetwork`].
// #[account]
// pub struct CreateNetworkAccounts<AI> {
//     /// The network to create.
//     #[validate(data = GatewayNetworkCreate{
//     system_program: &self.system_program,
//     rent: Some(rent),
//     funder: self.funder.as_ref(),
//     funder_seeds: None,
//     cpi: CPIChecked,
//     })]
//     pub network: GatekeeperNetworkAccount<AI>,
//     /// The system program
//     pub system_program: SystemProgram<AI>,
//     /// The signer for the network.
//     #[validate(data = (NetworkSignerSeeder{ network: *self.network.info().key() }, signer_bump))]
//     pub network_signer: Seeds<AI, NetworkSignerSeeder>,
//     /// The funder for the network if needed.
//     #[validate(signer(IfSome), writable(IfSome))]
//     pub funder: Option<AI>,
// }
// /// Data for [`CreateNetwork`].
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::network_data_len`].
    pub network_data_len: u16,
    /// The [`GatekeeperNetwork::signer_bump`].
    pub signer_bump: u8,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::network_data_len`].
    pub network_data_len: u16,
    /// The [`GatekeeperNetwork::signer_bump`].
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
}
