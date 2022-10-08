use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};

pub fn refresh_pass(pass: &mut Account<Pass>, _subject: Pubkey, _pass_number: u16) -> Result<()> {
    pass.refresh()
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassRefresh<'info> {
    #[account(
        seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), & pass_number.to_le_bytes()],
        bump,
        constraint = gatekeeper.can_access(&authority.key(), GatekeeperKeyFlags::REFRESH),
        mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
}

