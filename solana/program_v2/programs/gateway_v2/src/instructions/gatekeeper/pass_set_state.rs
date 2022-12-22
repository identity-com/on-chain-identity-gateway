use anchor_lang::prelude::*;

use crate::constants::PASS_SEED;
use crate::errors::PassErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, Pass, PassState};

pub fn pass_set_state(pass: &mut Account<Pass>, state: PassState) -> Result<()> {
    pass.state = state;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: PassState)]
pub struct PassSetState<'info> {
    // TODO: Since this in NOT init, bump SHOULD/MUST be assigned.
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), & pass.pass_number.to_le_bytes() ],
    bump = pass.signer_bump,
    constraint = gatekeeper.can_access(& authority, match state {
    PassState::Active => GatekeeperKeyFlags::UNFREEZE,
    PassState::Frozen => GatekeeperKeyFlags::FREEZE,
    PassState::Revoked => GatekeeperKeyFlags::REVOKE,
    }),
    constraint = pass.is_valid_state_change(& state) @ PassErrors::InvalidStateChange,
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    // TODO: do we need this?
    pub system_program: Program<'info, System>,
    // TODO: do we need this?
    pub network: Account<'info, GatekeeperNetwork>,
    pub gatekeeper: Account<'info, Gatekeeper>,
}
