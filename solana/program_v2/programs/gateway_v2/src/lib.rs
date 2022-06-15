#![feature(in_band_lifetimes)]
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

declare_id!("9NqxYNoTQGuh6odAMUuStpA3r9MnrSrBaifs7cxMDDth");

pub mod account;
pub mod instructions;
pub mod types;
pub mod util;

use crate::account::*;
use crate::types::NetworkFees;
use crate::types::NetworkKeyFlags;
use crate::instructions::*;

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(ctx: Context<CreateNetworkAccounts>, data: CreateNetworkData) -> Result<()> {
        CreateNetwork::process(data, &mut ctx.accounts.network)
    }

    pub fn update_network(ctx: Context<UpdateNetworkAccounts>, data: UpdateNetworkData) -> Result<()> {
        UpdateNetwork::process(data, &mut ctx.accounts.network, &mut ctx.accounts.payer)
    }
}

#[derive(Accounts, Debug)]
pub struct UpdateNetworkAccounts<'info> {
    #[account(
    mut,
    realloc = (5000 as usize),
    realloc::payer = payer,
    realloc::zero = false
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetworkAccounts<'info> {
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
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

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
pub struct UpdateFees {
    pub add: Vec<NetworkFees>,
    pub remove: Vec<NetworkFees>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateKeys {
    pub add: Vec<NetworkAuthKey>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::networkx_data_len`].
    pub network_data_len: u16,
    /// The [`GatekeeperNetwork::signer_bump`].
    pub fees: UpdateFees,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: UpdateKeys,
}
