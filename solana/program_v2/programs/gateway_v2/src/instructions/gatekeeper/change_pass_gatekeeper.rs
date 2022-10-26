use crate::constants::PASS_SEED;
use crate::errors::PassErrors;
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperNetwork, Pass};
use anchor_lang::prelude::*;

pub fn change_pass_gatekeeper(ctx: Context<PassChangeGatekeeper>) -> Result<()> {
    // TODO: Check if feature flag is set
    let pass = &mut ctx.accounts.pass;
    let old_gatekeeper = &mut ctx.accounts.old_gatekeeper;
    let new_gatekeeper = &mut ctx.accounts.new_gatekeeper;

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
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), &pass.pass_number.to_le_bytes() ],
    bump,
    // TODO: @william commented constraint for now
    constraint = old_gatekeeper.can_access(&authority, GatekeeperKeyFlags::CHANGE_PASS_GATEKEEPER),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub old_gatekeeper: Account<'info, Gatekeeper>,
    pub new_gatekeeper: Account<'info, Gatekeeper>,
}
