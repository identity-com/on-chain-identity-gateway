use anchor_lang::prelude::*;

use crate::constants::{GATEKEEPER_SEED, PASS_SEED};
use crate::errors::{GatekeeperErrors, NetworkErrors, PassErrors};
use crate::state::{
    Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, GatekeeperState, NetworkFeatures, Pass,
};

pub fn change_pass_gatekeeper(ctx: Context<PassChangeGatekeeper>) -> Result<()> {
    let pass = &mut ctx.accounts.pass;
    let new_gatekeeper = &ctx.accounts.new_gatekeeper;

    pass.gatekeeper = new_gatekeeper.key();

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct PassChangeGatekeeper<'info> {
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), & pass.pass_number.to_le_bytes() ],
    bump = pass.signer_bump,
    constraint = old_gatekeeper.can_access(& authority, GatekeeperKeyFlags::CHANGE_PASS_GATEKEEPER),
    constraint = pass.gatekeeper == old_gatekeeper.key() @ PassErrors::InvalidGatekeeper,
    mut
    )]
    pub pass: Account<'info, Pass>,
    #[account(
    constraint = old_gatekeeper.gatekeeper_network == network.key(),
    constraint = pass.network == network.key(),
    constraint = network.supports_feature(NetworkFeatures::CHANGE_PASS_GATEKEEPER) @ NetworkErrors::UnsupportedNetworkFeature
    )]
    pub network: Box<Account<'info, GatekeeperNetwork>>,
    pub authority: Signer<'info>,
    #[account(
    constraint = pass.gatekeeper == old_gatekeeper.key(),
    constraint = old_gatekeeper.gatekeeper_state != GatekeeperState::Halted @ GatekeeperErrors::InvalidState,
    seeds = [GATEKEEPER_SEED, old_gatekeeper.subject.as_ref(), old_gatekeeper.gatekeeper_network.as_ref()],
    bump = old_gatekeeper.gatekeeper_bump
    )]
    pub old_gatekeeper: Account<'info, Gatekeeper>,
    #[account(
    constraint = old_gatekeeper.gatekeeper_network == new_gatekeeper.gatekeeper_network @ PassErrors::InvalidNetwork,
    seeds = [GATEKEEPER_SEED, new_gatekeeper.subject.as_ref(), new_gatekeeper.gatekeeper_network.as_ref()],
    bump = new_gatekeeper.gatekeeper_bump
    )]
    pub new_gatekeeper: Account<'info, Gatekeeper>,
}
