use crate::constants::GATEKEEPER_SEED;
use crate::state::{Gatekeeper, GatekeeperAuthKey, GatekeeperFees};
use anchor_lang::prelude::*;

// Runs all the update methods on the passed-in gatekeeper
pub fn update_gatekeeper(
    ctx: Context<UpdateGatekeeperAccount>,
    data: UpdateGatekeeperData,
) -> Result<()> {
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let authority = &mut ctx.accounts.authority;
    let staking_account = &mut ctx.accounts.staking_account;

    gatekeeper.add_auth_keys(&data, authority)?;
    gatekeeper.add_fees(&data, authority)?;
    gatekeeper.set_staking_account(staking_account, authority)?;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(data: UpdateGatekeeperData)]
pub struct UpdateGatekeeperAccount<'info> {
    #[account(
        mut,
        realloc = Gatekeeper::size(
                gatekeeper.token_fees.len() + data.token_fees.add.len() - data.token_fees.remove.len(),
                gatekeeper.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len(),
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    /// CHECK: Add Check Later
    pub staking_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Clone, Debug, AnchorDeserialize, AnchorSerialize)]
pub struct UpdateGatekeeperData {
    /// The fees for this gatekeeper
    pub token_fees: UpdateGatekeeperFees,
    /// The [`Gatekeeper::auth_threshold`].
    pub auth_threshold: Option<u8>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: UpdateGatekeeperKeys,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateGatekeeperFees {
    pub add: Vec<GatekeeperFees>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateGatekeeperKeys {
    pub add: Vec<GatekeeperAuthKey>,
    pub remove: Vec<Pubkey>,
}
