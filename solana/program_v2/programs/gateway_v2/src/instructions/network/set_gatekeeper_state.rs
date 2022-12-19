use crate::constants::GATEKEEPER_SEED;
use crate::state::{Gatekeeper, GatekeeperState};
use anchor_lang::prelude::*;

// Allows a network to set the state of a gatekeeper (Active, Frozen, Halted)
pub fn set_gatekeeper_state(
    ctx: Context<SetGatekeeperStateAccount>,
    state: GatekeeperState,
) -> Result<()> {
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let authority = &mut ctx.accounts.authority;

    // TODO: Should the authority net be checked against the NETWORK Auth_Keys
    // and not the Gatekeeper Auth_Keys?
    gatekeeper.set_gatekeeper_state(&state, authority)?;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: GatekeeperState)]
pub struct SetGatekeeperStateAccount<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    // TODO: Why is authority mut?
    #[account(mut)]
    pub authority: Signer<'info>,
    // TODO: Why do i need the system program? I don't see it being used in the instruction.
    pub system_program: Program<'info, System>,
}
