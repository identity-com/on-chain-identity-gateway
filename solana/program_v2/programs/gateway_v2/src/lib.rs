mod constants;
mod errors;
mod instructions;
mod state;
mod util;

use crate::instructions::admin::*;
use crate::instructions::network::*;
use crate::instructions::gatekeeper::*;
use crate::state::{GatekeeperState, PassState};
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

    pub fn gatekeeper_withdraw(
        ctx: Context<GatekeeperWithdrawAccount>,
        receiver: Pubkey,
    ) -> Result<()> {
        instructions::network::gatekeeper_withdraw(ctx, receiver)
    }

    pub fn issue_pass(
        ctx: Context<IssuePass>,
        subject: Pubkey,
        pass_number: u16,
    ) -> Result<()> {
        instructions::gatekeeper::issue_pass(
            ctx,
            subject,
            pass_number,
        )
    }

    pub fn set_pass_state(ctx: Context<PassSetState>, state: PassState, subject: Pubkey, pass_number: u16) -> Result<()> {
        instructions::gatekeeper::pass_set_state(&mut ctx.accounts.pass, state)
    }

    pub fn refresh_pass(ctx: Context<PassRefresh>, subject: Pubkey, pass_number: u16) -> Result<()> {
        instructions::gatekeeper::refresh_pass(&mut ctx.accounts.pass, subject, pass_number)
    }

    pub fn change_pass_gatekeeper(ctx: Context<PassChangeGatekeeper>) -> Result<()> {
        instructions::gatekeeper::change_pass_gatekeeper(ctx)
    }

    pub fn set_pass_data(ctx: Context<PassSetData>, gatekeeper_data: Option<[u8; 32]>, network_data: Option<[u8; 32]>) -> Result<()> {
        instructions::gatekeeper::set_pass_data(
            ctx,
            gatekeeper_data,
            network_data,
        )
    }
}
