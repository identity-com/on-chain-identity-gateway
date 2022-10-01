use anchor_lang::prelude::*;
use crate::{Gatekeeper, GatekeeperNetwork, Pass};
use crate::errors::PassErrors;
use crate::constants::PASS_SEED;

pub fn change_pass_gatekeeper(pass: &mut Account<Pass>,
                              old_gatekeeper: &mut Account<Gatekeeper>,
                              new_gatekeeper: &mut Account<Gatekeeper>) -> Result<()> {
    // TODO: Check if feature flag is set

    require!(pass.gatekeeper == old_gatekeeper.key(), PassErrors::InvalidGatekeeper);
    require!(old_gatekeeper.gatekeeper_network == new_gatekeeper.gatekeeper_network, PassErrors::InvalidNetwork);

    pass.gatekeeper = new_gatekeeper.key();

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassChangeGatekeeper<'info> {
    // TODO: Fix validation
    #[account(
    seeds = [PASS_SEED, subject.as_ref(), network.key().as_ref(), &pass_number.to_le_bytes() ],
    bump,
    // // TODO: Gatekeeper authority is required to set state
    // // constraint = pass.initial_authority == authority.key(),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub network: Account<'info, GatekeeperNetwork>,
    pub old_gatekeeper: Account<'info, Gatekeeper>,
    pub new_gatekeeper: Account<'info, Gatekeeper>,
}

