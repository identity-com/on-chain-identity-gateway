use crate::constants::GATEKEEPER_SEED;
use crate::state::{Gatekeeper, GatekeeperState};
use anchor_lang::prelude::*;

pub fn set_gatekeeper_state(
    gatekeeper: &mut Account<Gatekeeper>,
    state: GatekeeperState,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.set_gatekeeper_state(&state, authority)?;
    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: GatekeeperState)]
pub struct SetGatekeeperState<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
