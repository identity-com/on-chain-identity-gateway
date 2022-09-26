use anchor_lang::Key;
use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::{Gatekeeper, GatekeeperNetwork, Pass, PassState, Pubkey};

pub fn issue_pass(
    authority: Pubkey,
    bump: u8,
    pass: &mut Account<Pass>,
    network: &mut Account<GatekeeperNetwork>,
    gatekeeper: &mut Account<Gatekeeper>,
) -> Result<()> {
    pass.initial_authority = authority;
    pass.issue_time = Clock::get().unwrap().unix_timestamp;
    pass.network = network.key();
    pass.issuing_gatekeeper = gatekeeper.key();
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
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}