use crate::constants::PASS_SEED;
use crate::state::{Gatekeeper, GatekeeperNetwork, Pass, PassState};
use anchor_lang::prelude::*;
use anchor_lang::Key;

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
        seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), &pass_number.to_le_bytes()],
        bump
    )]
    pub pass: Account<'info, Pass>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
