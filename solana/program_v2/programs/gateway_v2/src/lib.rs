mod constants;
mod errors;
mod instructions;
mod state;
mod util;

use crate::instructions::admin::*;
use anchor_lang::prelude::*;
// TODO: Grind for better key
declare_id!("FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe");

#[program]
pub mod gateway_v2 {
    use super::*;

    pub fn create_network(
        ctx: Context<CreateNetworkAccount>,
        data: CreateNetworkData,
    ) -> Result<()> {
        instructions::admin::create_network(
            ctx,
            data,
        )
    }

    pub fn update_network(
        ctx: Context<UpdateNetworkAccount>,
        data: UpdateNetworkData,
    ) -> Result<()> {
        instructions::admin::update_network(
            ctx,
            &data,
        )
    }

    pub fn close_network(ctx: Context<CloseNetworkAccount>) -> Result<()> {
        instructions::admin::close_network(ctx)
    }
}
