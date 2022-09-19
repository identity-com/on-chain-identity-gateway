mod constants;
mod errors;
mod instructions;
mod state;
mod util;

use crate::instructions::*;
use crate::state::*;
use anchor_lang::prelude::*;

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

    pub fn issue_pass(
        ctx: Context<IssuePass>
    ) -> Result<()> {
        instructions::issue_pass(
            *ctx.accounts.authority.key,
            *ctx.bumps.get("pass").unwrap(),
            &mut ctx.accounts.pass,
            &mut ctx.accounts.network,
        )
    }

    pub fn pass_issue_state(ctx: Context<PassSetState>, state: PassState) -> Result<()> {
        instructions::pass_set_state(&mut ctx.accounts.pass, state)
    }
}