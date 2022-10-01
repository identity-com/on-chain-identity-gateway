use anchor_lang::Key;
use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::{Gatekeeper, GatekeeperNetwork, Pass, PassState, Pubkey};
use anchor_spl::{
    token::{Token, Mint, TokenAccount},

};

pub fn issue_pass(
    authority: Pubkey,
    bump: u8,
    pass: &mut Account<Pass>,
    network: &mut Account<GatekeeperNetwork>,
    gatekeeper: &mut Account<Gatekeeper>,
) -> Result<()> {
    pass.subject = authority;
    pass.issue_time = Clock::get().unwrap().unix_timestamp;
    pass.network = network.key();
    pass.gatekeeper = gatekeeper.key();
    pass.signer_bump = bump;
    pass.state = PassState::Active;
    pass.version = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct IssuePass<'info> {
    #[account(
        init,
        payer = payer,
        space = Pass::ON_CHAIN_SIZE,
        seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), &pass_number.to_le_bytes()],
        bump
    )]
    pub pass: Account<'info, Pass>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub sender: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,
}