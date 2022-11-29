use crate::constants::PASS_SEED;
use crate::errors::{GatekeeperErrors, NetworkErrors};
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass, PassState};
use crate::util::{
    calculate_network_and_gatekeeper_fee, create_and_invoke_transfer, get_gatekeeper_fees,
    get_network_fees,
};
use anchor_lang::prelude::*;
use anchor_lang::Key;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub fn issue_pass(ctx: Context<IssuePass>, subject: Pubkey, pass_number: u16) -> Result<()> {
    let pass = &mut ctx.accounts.pass;
    let network = &mut ctx.accounts.network;
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let payer = &mut ctx.accounts.payer;

    let spl_token_program = &mut ctx.accounts.spl_token_program;
    let mint_address = &mut ctx.accounts.mint_account.key();
    let network_ata = &mut ctx.accounts.network_token_account;
    let gatekeeper_ata = &mut ctx.accounts.gatekeeper_token_account;
    let funder_ata = &mut ctx.accounts.funder_token_account;

    // TODO(julian): Fix error handling
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
        payer.to_owned(),
        &[&payer.key()],
        fees.0,
    )?;

    create_and_invoke_transfer(
        spl_token_program.to_owned(),
        funder_ata.to_owned(),
        network_ata.to_owned(),
        payer.to_owned(),
        &[&payer.key()],
        fees.1,
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
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    pub gatekeeper: Box<Account<'info, Gatekeeper>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub spl_token_program: Program<'info, Token>,
    pub mint_account: Account<'info, Mint>,
    #[account(mut)]
    pub funder_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub network_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
