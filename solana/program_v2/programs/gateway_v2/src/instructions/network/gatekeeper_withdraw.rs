use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use anchor_lang::prelude::*;

// Will withdraw funds from the gatekeeper
pub fn gatekeeper_withdraw(
    receiver: Pubkey,
    gatekeeper: &mut Account<Gatekeeper>,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.gatekeeper_withdraw(receiver, authority)?;
    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(receiver: Pubkey)]
pub struct GatekeeperWithdrawAccount<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED, authority.key().as_ref()],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
