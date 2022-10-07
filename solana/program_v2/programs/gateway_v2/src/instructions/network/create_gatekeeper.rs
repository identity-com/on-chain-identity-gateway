use crate::constants::{GATEKEEPER_SEED, STAKING_SEED};
use crate::errors::GatekeeperErrors;
use crate::state::gatekeeper::{
    Gatekeeper, GatekeeperAuthKey, GatekeeperFees, GatekeeperKeyFlags, GatekeeperState,
};
use crate::state::GatekeeperNetwork;
use anchor_lang::prelude::*;

pub fn create_gatekeeper(
    ctx: Context<CreateGatekeeperAccount>,
    data: CreateGatekeeperData,
) -> Result<()> {
    let authority = &mut ctx.accounts.authority;
    let bump = *ctx.bumps.get("gatekeeper").unwrap();
    // let stake_bump = *ctx.bumps.get("stake").unwrap();
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let network = &mut ctx.accounts.network;
    let staking_account = &mut ctx.accounts.staking_account;

    if data.auth_keys.is_empty() {
        return Err(error!(GatekeeperErrors::NoAuthKeys));
    }
    // Checks if there are enough auth keys to create the gatekeeper, should maybe check in NetworkKeyFlags
    if data
        .auth_keys
        .iter()
        .filter(|key| {
            GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(GatekeeperKeyFlags::AUTH)
        })
        .count()
        < data.auth_threshold as usize
    {
        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
    }

    gatekeeper.authority = *authority.key;
    gatekeeper.gatekeeper_bump = bump;
    gatekeeper.gatekeeper_network = network.key();
    gatekeeper.staking_account = staking_account.key();
    gatekeeper.token_fees = data.token_fees;
    gatekeeper.auth_threshold = data.auth_threshold;
    gatekeeper.auth_keys = data.auth_keys;
    gatekeeper.gatekeeper_state = GatekeeperState::Active;

    network.gatekeepers.push(gatekeeper.key());

    Ok(())
}
/// Data for [`CreateGatekeeper`]
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateGatekeeperData {
    // Fees for the gatekeeper
    pub token_fees: Vec<GatekeeperFees>,
    pub auth_threshold: u8,
    pub auth_keys: Vec<GatekeeperAuthKey>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateGatekeeperData)]
pub struct CreateGatekeeperAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = Gatekeeper::size(
            data.auth_keys.len(),
            data.token_fees.len(),
        ),
        seeds = [GATEKEEPER_SEED, authority.key().as_ref(), network.key().as_ref()],
        bump
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        realloc = GatekeeperNetwork::size(
            network.fees.len(),
            network.auth_keys.len(),
            network.gatekeepers.len() + 1,
            network.supported_tokens.len(),
        ),
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    /// CHECK: Add Checking Later
    pub staking_account: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
