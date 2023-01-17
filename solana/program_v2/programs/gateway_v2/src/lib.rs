#![allow(clippy::result_large_err)]

extern crate core;

pub mod constants;
pub mod errors;
mod instructions;
pub mod state;
pub mod util;

use crate::instructions::admin::*;
use crate::instructions::gatekeeper::*;
use crate::instructions::network::*;
use crate::state::{GatekeeperState, PassState};
use anchor_lang::prelude::*;

declare_id!("gate2TBGydKNyMNUqz64s8bz4uaWS9PNreMbmAjb1Ft");

#[program]
pub mod solana_anchor_gateway {
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
        instructions::admin::update_network(ctx, data)
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

    pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>, amount: u64) -> Result<()> {
        instructions::network::gatekeeper_withdraw(ctx, amount)
    }

    pub fn issue_pass(ctx: Context<IssuePass>, subject: Pubkey, pass_number: u16) -> Result<()> {
        instructions::gatekeeper::issue_pass(ctx, subject, pass_number)
    }

    pub fn set_pass_state(ctx: Context<PassSetState>, state: PassState) -> Result<()> {
        instructions::gatekeeper::pass_set_state(&mut ctx.accounts.pass, state)
    }

    pub fn refresh_pass(ctx: Context<PassRefresh>) -> Result<()> {
        instructions::gatekeeper::refresh_pass(ctx)
    }

    pub fn change_pass_gatekeeper(ctx: Context<PassChangeGatekeeper>) -> Result<()> {
        instructions::gatekeeper::change_pass_gatekeeper(ctx)
    }

    pub fn set_pass_data(
        ctx: Context<PassSetData>,
        gatekeeper_data: Option<[u8; 32]>,
        network_data: Option<[u8; 32]>,
    ) -> Result<()> {
        instructions::gatekeeper::set_pass_data(ctx, gatekeeper_data, network_data)
    }

    pub fn expire_pass(ctx: Context<PassExpire>) -> Result<()> {
        instructions::gatekeeper::expire_pass(ctx)
    }

    pub fn verify_pass(ctx: Context<PassVerify>) -> Result<()> {
        instructions::gatekeeper::verify_pass(ctx)
    }
}
