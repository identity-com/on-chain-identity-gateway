use anchor_lang::Key;
use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::state::{Pass, PassState};
use crate::errors::PassErrors;
use crate::GatekeeperNetwork;

pub fn pass_set_state(
    pass: &mut Account<Pass>,
    state: PassState,
) -> Result<()> {
    require!(pass.is_valid_state_change(&state), PassErrors::InvalidStateChange);
    require!(pass.is_valid_gatekeeper_state_change(&state), PassErrors::InvalidStateChange);

    pass.state = state;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassSetState<'info> {
    // TODO: Fix validation
    #[account(
    // seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), &pass_number.to_le_bytes()],
    // bump,
    // // TODO: Gatekeeper authority is required to set state
    // // constraint = pass.initial_authority == authority.key(),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,

}

