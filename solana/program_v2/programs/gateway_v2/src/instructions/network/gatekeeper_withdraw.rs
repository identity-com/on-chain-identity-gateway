use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use anchor_lang::prelude::*;

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(ctx: Context<GatekeeperWithdrawAccount>) -> Result<()> {
    let gatekeeper = &mut ctx.accounts.gatekeeper;
    let authority = &mut ctx.accounts.authority;
    let receiver = &mut ctx.accounts.receiver;

    gatekeeper.gatekeeper_withdraw(receiver, authority)?;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction()]
pub struct GatekeeperWithdrawAccount<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref()],
        bump = gatekeeper.gatekeeper_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub receiver: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
