use anchor_lang::prelude::*;

use crate::constants::PASS_SEED;
use crate::errors::PassErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, Pass};

pub fn change_pass_gatekeeper(ctx: Context<PassChangeGatekeeper>) -> Result<()> {
    // TODO: Check if feature flag is set
    let pass = &mut ctx.accounts.pass;
    // TODO: These don't need to be mut
    let old_gatekeeper = &mut ctx.accounts.old_gatekeeper;
    let new_gatekeeper = &mut ctx.accounts.new_gatekeeper;

    // TODO: move to constraint
    require!(
        pass.gatekeeper == old_gatekeeper.key(),
        PassErrors::InvalidGatekeeper
    );
    require!(
        old_gatekeeper.gatekeeper_network == new_gatekeeper.gatekeeper_network,
        PassErrors::InvalidNetwork
    );

    pass.gatekeeper = new_gatekeeper.key();

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct PassChangeGatekeeper<'info> {
    // TODO: Since this in NOT init, bump SHOULD/MUST be assigned.
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), & pass.pass_number.to_le_bytes() ],
    bump = pass.signer_bump,
    constraint = old_gatekeeper.can_access(& authority, GatekeeperKeyFlags::CHANGE_PASS_GATEKEEPER),
    constraint = pass.gatekeeper == old_gatekeeper.key() @ PassErrors::InvalidGatekeeper,
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    // TODO: This is not needed?
    pub system_program: Program<'info, System>,
    // TODO: This is not needed?
    pub network: Account<'info, GatekeeperNetwork>,
    pub old_gatekeeper: Account<'info, Gatekeeper>,
    #[account(
    constraint = old_gatekeeper.gatekeeper_network == new_gatekeeper.gatekeeper_network @ PassErrors::InvalidNetwork
    )]
    pub new_gatekeeper: Account<'info, Gatekeeper>,
}
