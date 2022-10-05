use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::state::{GatekeeperNetwork, Pass};

pub fn refresh_pass(pass: &mut Account<Pass>, _subject: Pubkey, _pass_number: u16) -> Result<()> {
    pass.refresh()
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassRefresh<'info> {
    // TODO: Fix validation
    #[account(
    seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), & pass_number.to_le_bytes()],
    bump,
    // // TODO: Gatekeeper authority is required to set state
    // constraint = pass.initial_authority == authority.key(),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
}

