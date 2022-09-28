use crate::constants::GATEKEEPER_SEED;
use crate::state::*;
use anchor_lang::prelude::*;
/// Placeholder for additional close_gatekeeper functionality
pub fn close_gatekeeper() -> Result<()> {
    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseGatekeeperAccount<'info> {
    #[account(
        mut,
        close = destination,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
        constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::AUTH),
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
