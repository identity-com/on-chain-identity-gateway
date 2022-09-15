mod constants;
mod errors;
mod instructions;
mod state;
mod util;

use crate::instructions::*;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
// TODO: Grind for better key
declare_id!("FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe");

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(
        ctx: Context<CreateNetworkAccount>,
        data: CreateNetworkData,
    ) -> Result<()> {
        instructions::create_network(
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
        instructions::update_network(
            &data,
            &mut ctx.accounts.network,
            &mut ctx.accounts.authority,
        )
    }

    pub fn close_network(_ctx: Context<CloseNetworkAccount>) -> Result<()> {
        instructions::close_network()
    }
}
