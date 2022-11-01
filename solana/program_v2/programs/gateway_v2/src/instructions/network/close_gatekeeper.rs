use crate::constants::GATEKEEPER_SEED;
use crate::errors::*;
use crate::state::*;
use anchor_lang::prelude::*;

pub fn close_gatekeeper(ctx: Context<CloseGatekeeperAccount>) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let gatekeeper = &mut ctx.accounts.gatekeeper;

    // Find and remove the gatekeeper from the network
    let index = network
        .gatekeepers
        .iter()
        .position(|k| k == &gatekeeper.key());

    if let Some(key_index) = index {
        network.gatekeepers.remove(key_index);
    } else {
        return Err(error!(GatekeeperErrors::InvalidGatekeeper));
    }

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct CloseGatekeeperAccount<'info> {
    #[account(
    mut,
    close = destination,
    seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
    bump = gatekeeper.gatekeeper_bump,
    constraint = gatekeeper.can_access(& authority, GatekeeperKeyFlags::AUTH),
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(
        mut,
        realloc = GatekeeperNetwork::size(
            network.fees.len(),
            network.auth_keys.len(),
            network.gatekeepers.len() - 1,
            network.supported_tokens.len(),
        ),
        realloc::payer = payer,
        realloc::zero = false,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
