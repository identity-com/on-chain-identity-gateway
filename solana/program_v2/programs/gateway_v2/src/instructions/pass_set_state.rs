use anchor_lang::Key;
use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::{Pass, PassState, Pubkey};
use crate::errors::PassErrors;

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
pub struct PassSetState<'info> {
    #[account(
        // TODO: Should gatekeeper or network be part of the keys?
        seeds = [PASS_SEED, authority.key().as_ref()],
        bump,
        // TODO: Gatekeeper authority is required to set state
        constraint = pass.initial_authority == authority.key(),
        mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

