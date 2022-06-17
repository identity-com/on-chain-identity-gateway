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

use crate::account::{GatekeeperNetwork, NetworkAuthKey};
use anchor_lang::prelude::*;

declare_id!("9NqxYNoTQGuh6odAMUuStpA3r9MnrSrBaifs7cxMDDth");

pub mod account;
pub mod arguments;
pub mod instructions;
pub mod types;
pub mod util;

use crate::account::*;
use crate::arguments::*;
use crate::instructions::*;
use crate::types::NetworkFees;
use crate::types::NetworkKeyFlags;

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(
        ctx: Context<CreateNetworkAccount>,
        data: CreateNetworkData,
    ) -> Result<()> {
        CreateNetwork::process(data, &mut ctx.accounts.network)
    }

    pub fn update_network(
        ctx: Context<UpdateNetworkAccount>,
        data: UpdateNetworkData,
    ) -> Result<()> {
        UpdateNetwork::process(data, &mut ctx.accounts.network, &mut ctx.accounts.payer)
    }

    pub fn close_network(ctx: Context<CloseNetworkAccount>) -> Result<()> {
        Ok(())
    }
}
