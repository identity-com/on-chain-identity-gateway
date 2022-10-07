use crate::constants::PASS_SEED;
use crate::errors::PassErrors;
use crate::state::{GatekeeperNetwork, Pass, PassState};
use anchor_lang::prelude::*;

pub fn set_pass_data(
    ctx: Context<PassSetData>,
    gatekeeper_data: Option<[u8; 32]>,
    network_data: Option<[u8; 32]>,
) -> Result<()> {

    let pass = &mut ctx.accounts.pass;


    msg!("Issuing pass for with PASS_SEED: {:?}", PASS_SEED);
    msg!("Issuing pass for with subject: {:?}", pass.subject.as_ref());
    msg!("Issuing pass for with network: {:?}", pass.network.key().as_ref());
    msg!("Issuing pass for with pass_number: {:?}", &pass.pass_number.to_le_bytes());
    msg!("Issuing pass for bump: {:?}", pass.signer_bump);

    if let Some(data) = gatekeeper_data {
        pass.gatekeeper_data = data;
    }

    if let Some(data) = network_data {
        pass.network_data = data;
    }

    Ok(())
}

#[derive(Accounts, Debug)]
pub struct PassSetData<'info> {
    // TODO: Fix validation
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.as_ref(), &pass.pass_number.to_le_bytes()],
    bump = pass.signer_bump,
    // // TODO: Gatekeeper authority is required to set state
    // // constraint = pass.initial_authority == authority.key(),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// gatekeeper_data,
// network_data,
