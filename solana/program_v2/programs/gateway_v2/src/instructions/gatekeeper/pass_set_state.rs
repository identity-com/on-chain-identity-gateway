use anchor_lang::prelude::*;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass, PassState};
use crate::errors::PassErrors;
use crate::constants::PASS_SEED;

pub fn pass_set_state(
    pass: &mut Account<Pass>,
    state: PassState,
) -> Result<()> {
    require!(pass.is_valid_state_change(&state), PassErrors::InvalidStateChange);

    pass.state = state;

    Ok(())
}


#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16, state: PassState)]
pub struct PassSetState<'info> {
    #[account(
        seeds = [PASS_SEED, pass.subject.as_ref(), network.key().as_ref(), &pass.pass_number.to_le_bytes()],
        bump,
        constraint = gatekeeper.can_access(&authority.key(), match state {
                PassState::Active => GatekeeperKeyFlags::UNFREEZE,
                PassState::Frozen => GatekeeperKeyFlags::FREEZE,
                PassState::Revoked => GatekeeperKeyFlags::REVOKE,
            }),
        mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
}

