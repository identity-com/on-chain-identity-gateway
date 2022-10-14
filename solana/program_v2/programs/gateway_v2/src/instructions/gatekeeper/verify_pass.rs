use crate::constants::PASS_SEED;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};
use anchor_lang::prelude::*;

pub fn verify_pass(ctx: Context<PassVerify>) -> Result<()> {
    let pass = &mut ctx.accounts.pass;

    pass.verify()
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassVerify<'info> {
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), &pass.pass_number.to_le_bytes() ],
    bump,
    constraint = gatekeeper.can_access(&authority, GatekeeperKeyFlags::EXPIRE_PASS),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
}
