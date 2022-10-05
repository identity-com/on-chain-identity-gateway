use crate::constants::GATEKEEPER_SEED;
use crate::state::{Gatekeeper, GatekeeperAuthKey, GatekeeperFees, GatekeeperSize};
use anchor_lang::prelude::*;

// Runs all the update methods on the passed-in gatekeeper
pub fn update_gatekeeper(
    ctx: Context<UpdateGatekeeperAccount>,
    data: UpdateGatekeeperData,
) -> Result<()> {
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let authority = &mut ctx.accounts.authority;

    gatekeeper.add_auth_keys(&data, authority)?;
    gatekeeper.add_fees(&data, authority)?;
    gatekeeper.set_network(&data, authority)?;
    gatekeeper.set_staking_account(&data, authority)?;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(data: UpdateGatekeeperData)]
pub struct UpdateGatekeeperAccount<'info> {
    #[account(
        mut,
        realloc = Gatekeeper::on_chain_size_with_arg(
            GatekeeperSize{
                fees_count: (gatekeeper.token_fees.len() + data.token_fees.add.len() - data.token_fees.remove.len()) as u16,
                auth_keys: (gatekeeper.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len()) as u16,
            }
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), gatekeeper.gatekeeper_network.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Clone, Debug, AnchorDeserialize, AnchorSerialize)]
pub struct UpdateGatekeeperData {
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Option<Pubkey>,
    /// The staking account of this gatekeeper
    pub staking_account: Option<Pubkey>,
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
