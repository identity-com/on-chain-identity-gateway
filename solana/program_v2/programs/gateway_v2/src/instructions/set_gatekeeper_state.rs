use crate::constants::NETWORK_SEED;
use crate::state::{
    GatekeeperAuthKey, GatekeeperNetwork, GatekeeperNetworkSize, GatekeeperState, NetworkFees,
};
use anchor_lang::prelude::*;

pub fn set_gatekeeper_state(
    gatekeeper: &mut Account<Gatekeeper>,
    state: GatekeeperState,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.set_gatekeeper_state(state, authority)?;
    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(state: Gatekeeper)]
pub struct SetGatekeeperState<'info> {
    #[account(
        mut,
        realloc::zero = false,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
