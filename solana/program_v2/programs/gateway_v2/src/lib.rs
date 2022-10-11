mod constants;
mod errors;
mod instructions;
mod state;
mod util;

use crate::instructions::admin::*;
use crate::instructions::network::*;
use crate::state::GatekeeperState;
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
        instructions::admin::create_network(ctx, data)
    }

    pub fn update_network(
        ctx: Context<UpdateNetworkAccount>,
        data: UpdateNetworkData,
    ) -> Result<()> {
        instructions::admin::update_network(ctx, &data)
    }

    pub fn close_network(ctx: Context<CloseNetworkAccount>) -> Result<()> {
        instructions::admin::close_network(ctx)
    }

    pub fn create_gatekeeper(
        ctx: Context<CreateGatekeeperAccount>,
        data: CreateGatekeeperData,
    ) -> Result<()> {
        instructions::network::create_gatekeeper(ctx, data)
    }

    pub fn update_gatekeeper(
        ctx: Context<UpdateGatekeeperAccount>,
        data: UpdateGatekeeperData,
    ) -> Result<()> {
        instructions::network::update_gatekeeper(ctx, data)
    }

    pub fn close_gatekeeper(ctx: Context<CloseGatekeeperAccount>) -> Result<()> {
        instructions::network::close_gatekeeper(ctx)
    }

    pub fn set_gatekeeper_state(
        ctx: Context<SetGatekeeperStateAccount>,
        state: GatekeeperState,
    ) -> Result<()> {
        instructions::network::set_gatekeeper_state(ctx, state)
    }

    pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>) -> Result<()> {
        instructions::network::gatekeeper_withdraw(ctx)
    }
}
