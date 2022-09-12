use anchor_lang::prelude::*;
use crate::constants::NETWORK_SEED;
use crate::state::GatekeeperNetwork;

/// Placeholder for additional close_network functionality
pub fn close_network(
) -> Result<()> {
    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseNetworkAccount<'info> {
    // TODO: Add constraint check (authority in auth keys ??)
    #[account(
        mut,
        close = destination,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}