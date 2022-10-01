use crate::constants::NETWORK_SEED;
use crate::state::*;
use anchor_lang::prelude::*;
use crate::errors::NetworkErrors;

/// Placeholder for additional close_network functionality
pub fn close_network(ctx: Context<CloseNetworkAccount>) -> Result<()> {
    require!(ctx.accounts.network.can_close(), NetworkErrors::AccountInUse);

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseNetworkAccount<'info> {
    #[account(
        mut,
        close = destination,
        seeds = [NETWORK_SEED, network.authority.key().as_ref(), &network.network_index.to_le_bytes()],
        bump,
        constraint = network.can_access(&authority, NetworkKeyFlags::AUTH),
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
}
