use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::{GATEKEEPER_SEED, PASS_SEED};
use crate::errors::GatekeeperErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};
use crate::util::{
    calculate_network_and_gatekeeper_fee, create_and_invoke_transfer, get_gatekeeper_fees,
    get_network_fees,
};

pub fn verify_pass(ctx: Context<PassVerify>) -> Result<()> {
    let pass = &mut ctx.accounts.pass;
    let network = &mut ctx.accounts.network;
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let funder = &mut ctx.accounts.funder;

    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let mint_address = &mut ctx.accounts.mint_account.key();
    let network_ata = &mut ctx.accounts.network_token_account;
    let gatekeeper_ata = &mut ctx.accounts.gatekeeper_token_account;
    let funder_ata = &mut ctx.accounts.funder_token_account;

    // TODO: Can we put the fee transfers into a trait and reuse dependent on the type of instruction?
    let absolute_fee = get_gatekeeper_fees(&gatekeeper.token_fees, *mint_address)?.verify;
    let network_percentage = get_network_fees(&network.fees, *mint_address)?.verify;
    let (network_fee, gatekeeper_fee) =
        calculate_network_and_gatekeeper_fee(absolute_fee, network_percentage);

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        network_ata.to_owned(),
        funder.to_owned(),
        &[&funder.key()],
        network_fee,
    )?;

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        gatekeeper_ata.to_owned(),
        funder.to_owned(),
        &[&funder.key()],
        gatekeeper_fee,
    )?;

    pass.verify()
}

#[derive(Accounts)]
pub struct PassVerify<'info> {
    // TODO: Since this in NOT init, bump SHOULD/MUST be assigned.
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), network.key().as_ref(), & pass.pass_number.to_le_bytes()],
    bump = pass.signer_bump,
    constraint = gatekeeper.can_access(& authority, GatekeeperKeyFlags::VERIFY) @ GatekeeperErrors::InvalidKey,
    mut
    )]
    pub pass: Box<Account<'info, Pass>>,
    // TODO: Add verification here. The network MUST match the one of the pass and the gatekeeper.
    // TODO: THIS can be done by using THIS network to validate both pass and Gatekeeper PDA
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    // TODO: Add PDA verification
    // TODO: Since this in NOT init, bump SHOULD/MUST be assigned.
    pub gatekeeper: Box<Account<'info, Gatekeeper>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    // TODO: non-mut funder? (ok maybe that's true, but I've seen other examples were the funder is mut)
    pub funder: Signer<'info>,
    pub authority: Signer<'info>,
    // TODO: This is not needed?
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    // TODO: I actually would prefer to use a constraint for mint account verification, even if it
    // requires a little overhead.
    pub mint_account: Account<'info, Mint>,
    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,
    #[account(
    mut,
    constraint = network_token_account.owner == * network.to_account_info().key,
    )]
    pub network_token_account: Account<'info, TokenAccount>,
    #[account(
    mut,
    constraint = gatekeeper_token_account.owner == * gatekeeper.to_account_info().key,
    )]
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
