use crate::constants::GATEKEEPER_SEED;
use crate::state::{Gatekeeper, GatekeeperState};
use anchor_lang::prelude::*;

pub fn set_gatekeeper_state(
    state: &GatekeeperState,
    gatekeeper: &mut Account<Gatekeeper>,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.set_gatekeeper_state(state, authority)?;
    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: GatekeeperState)]
pub struct SetGatekeeperStateAccount<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref()],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
