use crate::constants::NETWORK_SEED;
use crate::state::*;
use anchor_lang::prelude::*;
/// Placeholder for additional close_network functionality
pub fn close_network() -> Result<()> {
    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseNetworkAccount<'info> {
    #[account(
        mut,
        close = destination,
        seeds = [NETWORK_SEED, network.authority.key().as_ref()],
        bump = network.network_bump,
        constraint = network.can_access(&authority, NetworkKeyFlags::AUTH),
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
