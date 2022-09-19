use anchor_lang::Key;
use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::{GatekeeperNetwork, Pass, PassState, Pubkey};

pub fn issue_pass(
    authority: Pubkey,
    bump: u8,
    pass: &mut Account<Pass>,
    network: &mut Account<GatekeeperNetwork>,
) -> Result<()> {
    pass.initial_authority = authority;
    pass.issue_time = Clock::get().unwrap().unix_timestamp;
    pass.network = network.key();
    // TODO: Gatekeeper
    pass.signer_bump = bump;
    pass.state = PassState::Active;
    pass.version = 0;

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct IssuePass<'info> {
    #[account(
        init,
        payer = authority,
        space = Pass::size(0, 0),
        seeds = [PASS_SEED, authority.key().as_ref()],
        bump
    )]
    pub pass: Account<'info, Pass>,
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}