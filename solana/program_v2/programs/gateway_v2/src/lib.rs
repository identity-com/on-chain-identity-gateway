// #![feature(in_band_lifetimes)]
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

declare_id!("8sPUQcf96QpGyAuXM36Trf4FqsXBbM6wT9PKQjHLjysq");

use crate::account::NetworkAuthKey;
use crate::arguments::*;
use crate::instructions::{CreateNetwork, UpdateNetwork};
use crate::types::NetworkKeyFlags;
use anchor_lang::prelude::*;

pub mod account;
pub mod arguments;
pub mod instructions;
pub mod types;
pub mod util;

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(
        ctx: Context<CreateNetworkAccount>,
        data: CreateNetworkData,
    ) -> Result<()> {
        CreateNetwork::process(
            *ctx.accounts.authority.key,
            *ctx.bumps.get("network").unwrap(),
            data,
            &mut ctx.accounts.network,
        )
    }

    pub fn update_network(
        ctx: Context<UpdateNetworkAccount>,
        data: UpdateNetworkData,
    ) -> Result<()> {
        // ctx.remaining_accounts.iter().for_each(|acc| {
        //     !msg("{}", acc);
        // });

        UpdateNetwork::process(
            &data,
            &mut ctx.accounts.network,
            &mut ctx.accounts.authority,
        )
    }

    pub fn close_network(_ctx: Context<CloseNetworkAccount>) -> Result<()> {
        Ok(())
    }
}
