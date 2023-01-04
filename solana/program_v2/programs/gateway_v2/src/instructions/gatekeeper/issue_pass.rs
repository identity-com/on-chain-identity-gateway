use anchor_lang::prelude::*;
use anchor_lang::Key;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::{GATEKEEPER_SEED, PASS_SEED};
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass, PassState};
use crate::util::{
    calculate_network_and_gatekeeper_fee, create_and_invoke_transfer, get_gatekeeper_fees,
    get_network_fees,
};

pub fn issue_pass(ctx: Context<IssuePass>, subject: Pubkey, pass_number: u16) -> Result<()> {
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
    let absolute_fee = get_gatekeeper_fees(&gatekeeper.token_fees, *mint_address)?.issue;
    let network_percentage = get_network_fees(&network.fees, *mint_address)?.issue;
    let (network_fee, gatekeeper_fee) =
        calculate_network_and_gatekeeper_fee(absolute_fee, network_percentage);

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        gatekeeper_ata.to_owned(),
        funder.to_owned(),
        &[&funder.key()],
        gatekeeper_fee,
    )?;

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        network_ata.to_owned(),
        funder.to_owned(),
        &[&funder.key()],
        network_fee,
    )?;

    pass.signer_bump = *ctx.bumps.get("pass").unwrap();
    pass.subject = subject;
    pass.issue_time = Clock::get().unwrap().unix_timestamp;
    pass.network = network.key();
    pass.gatekeeper = gatekeeper.key();
    pass.state = PassState::Active;
    pass.version = 0;
    pass.pass_number = pass_number;

    Ok(())
}

#[derive(Accounts)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct IssuePass<'info> {
    #[account(
    init,
    payer = payer,
    space = Pass::ON_CHAIN_SIZE,
    seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), & pass_number.to_le_bytes()],
    constraint = gatekeeper.can_access(& authority, GatekeeperKeyFlags::ISSUE),
    bump
    )]
    pub pass: Box<Account<'info, Pass>>,
    #[account(
    constraint = gatekeeper.gatekeeper_network == network.key()
    )]
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    #[account(
    seeds = [GATEKEEPER_SEED, gatekeeper.authority.as_ref(), network.key().as_ref()],
    bump = gatekeeper.gatekeeper_bump
    )]
    pub gatekeeper: Box<Account<'info, Gatekeeper>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub funder: Signer<'info>,
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
