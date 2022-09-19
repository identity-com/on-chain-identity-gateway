use crate::constants::GATEKEEPER_SEED;
use crate::state::Gatekeeper;
use anchor_lang::prelude::*;

pub fn gatekeeper_withdraw(
    gatekeeper: &mut Account<Gatekeeper>,
    receiver: Pubkey,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.gatekeeper_withdraw(receiver, authority)?;
    Ok(())
}

#[derive(Accounts, Debug, AnchorDeserialize, AnchorSerialize)]
#[instruction(state: Gatekeeper)]
pub struct GatekeeperWithdraw<'info> {
    #[account(
        mut,
        seeds = [GATEKEEPER_SEED],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
