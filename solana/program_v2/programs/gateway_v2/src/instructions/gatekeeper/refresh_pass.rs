use crate::constants::PASS_SEED;
use crate::errors::{GatekeeperErrors, NetworkErrors};
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};
use crate::util::{
    calculate_network_and_gatekeeper_fee, create_and_invoke_transfer, get_gatekeeper_fees,
    get_network_fees,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub fn refresh_pass(ctx: Context<PassRefresh>) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let authority = &mut ctx.accounts.authority;

    let pass = &mut ctx.accounts.pass;
    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let mint_address = &mut ctx.accounts.mint_account.key();
    let network_ata = &mut ctx.accounts.network_token_account;
    let gatekeeper_ata = &mut ctx.accounts.gatekeeper_token_account;
    let funder_ata = &mut ctx.accounts.funder_token_account;

    // TODO(julian): Fix error handling
    // IDCOM-2223
    let raw_gatekeeper_fee = match get_gatekeeper_fees(&gatekeeper.token_fees, *mint_address) {
        Some(fee) => fee.issue,
        None => return Err(error!(GatekeeperErrors::GatekeeperFeeNotProvided)),
    };

    let raw_network_fee = match get_network_fees(&network.fees, *mint_address) {
        Some(fee) => fee.issue,
        None => return Err(error!(NetworkErrors::NetworkFeeNotProvided)),
    };
    let fees = calculate_network_and_gatekeeper_fee(raw_gatekeeper_fee, raw_network_fee);

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        gatekeeper_ata.to_owned(),
        authority.to_owned(),
        &[&authority.key()],
        fees.0,
    )?;

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        network_ata.to_owned(),
        authority.to_owned(),
        &[&authority.key()],
        fees.1,
    )?;

    pass.refresh()
}

#[derive(Accounts)]
pub struct PassRefresh<'info> {
    #[account(
        seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), &pass.pass_number.to_le_bytes() ],
        bump,
        constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::REFRESH),
        mut
    )]
    pub pass: Box<Account<'info, Pass>>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    pub gatekeeper: Box<Account<'info, Gatekeeper>>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub network_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
