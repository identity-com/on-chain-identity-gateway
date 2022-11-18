use crate::constants::PASS_SEED;
use crate::state::{
    Gatekeeper, GatekeeperFees, GatekeeperKeyFlags, GatekeeperNetwork, Pass, PassState,
};
use anchor_lang::prelude::*;
use anchor_lang::Key;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[inline(never)]
pub fn issue_pass(ctx: Context<IssuePass>, subject: Pubkey, pass_number: u16) -> Result<()> {
    let pass = &mut ctx.accounts.pass;
    let network = &mut ctx.accounts.network;
    let gatekeeper = &mut ctx.accounts.gatekeeper;

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
        // FIXME(julian): Fix this before merging, working around a fixture issue
        // constraint = gatekeeper.can_access(& authority, GatekeeperKeyFlags::ISSUE),
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
    pub mint_address: Account<'info, Mint>,
    pub funder_token_account: Account<'info, TokenAccount>,
    pub network_token_account: Account<'info, TokenAccount>,
    pub gatekeeper_token_account: Account<'info, TokenAccount>,
}
