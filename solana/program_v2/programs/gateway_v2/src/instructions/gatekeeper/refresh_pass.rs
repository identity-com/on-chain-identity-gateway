use crate::constants::PASS_SEED;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};
use anchor_lang::prelude::*;

pub fn refresh_pass(pass: &mut Account<Pass>) -> Result<()> {
    pass.refresh()
}

#[derive(Accounts, Debug)]
pub struct PassRefresh<'info> {
    #[account(
        seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), &pass.pass_number.to_le_bytes() ],
        bump,
        // TODO: @william commented constraint for now
        // constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::REFRESH),
        mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
}
