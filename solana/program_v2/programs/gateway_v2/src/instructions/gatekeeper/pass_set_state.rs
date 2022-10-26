use crate::constants::PASS_SEED;
use crate::errors::PassErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass, PassState};
use anchor_lang::prelude::*;

pub fn pass_set_state(pass: &mut Account<Pass>, state: PassState) -> Result<()> {
    require!(
        pass.is_valid_state_change(&state),
        PassErrors::InvalidStateChange
    );

    pass.state = state;

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: PassState)]
pub struct PassSetState<'info> {
    #[account(
        seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), &pass.pass_number.to_le_bytes() ],
        bump,
        // TODO: @william commented constraint for now
        constraint = gatekeeper.can_access(&authority, match state {
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
