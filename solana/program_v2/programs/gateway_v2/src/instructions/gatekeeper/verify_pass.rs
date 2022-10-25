use crate::constants::PASS_SEED;
use crate::state::{GatekeeperNetwork, Pass};
use anchor_lang::prelude::*;

pub fn verify_pass(ctx: Context<PassVerify>) -> Result<()> {
    let pass = &mut ctx.accounts.pass;

    pass.verify()
}

#[derive(Accounts, Debug)]
pub struct PassVerify<'info> {
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), network.key().as_ref(), &pass.pass_number.to_le_bytes()],
    bump,
    // TODO: @william commented constraint for now
    // constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::EXPIRE_PASS),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
}
