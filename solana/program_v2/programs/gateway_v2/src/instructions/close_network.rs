use crate::constants::NETWORK_SEED;
use crate::state::GatekeeperNetwork;
use anchor_lang::prelude::*;
use crate::types::*;
/// Placeholder for additional close_network functionality
pub fn close_network() -> Result<()> {
    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseNetworkAccount<'info> {
    #[account(
        mut,
        close = destination,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
        constraint = network.can_access(&authority, NetworkKeyFlags::AUTH),
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
