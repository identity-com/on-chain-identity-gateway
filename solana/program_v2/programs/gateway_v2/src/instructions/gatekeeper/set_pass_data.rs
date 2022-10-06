use anchor_lang::prelude::*;
use crate::constants::PASS_SEED;
use crate::state::{GatekeeperNetwork, Pass, PassState};
use crate::errors::PassErrors;

pub fn set_pass_data(
    ctx: Context<PassSetData>, gatekeeper_data: Option<[u8; 32]>, network_data: Option<[u8; 32]>
) -> Result<()> {
    let pass = &mut ctx.accounts.pass;

    if let Some(data) = gatekeeper_data {
        pass.gatekeeper_data = data;
    }

    if let Some(data) = network_data {
        pass.network_data = data;
    }

    Ok(())
}

#[derive(Accounts, Debug)]
#[instruction(subject: Pubkey, pass_number: u16)]
pub struct PassSetData<'info> {
    // TODO: Fix validation
    #[account(
    seeds = [PASS_SEED, subject.as_ref(), pass.network.key().as_ref(), &pass_number.to_le_bytes()],
    bump,
    // // TODO: Gatekeeper authority is required to set state
    // // constraint = pass.initial_authority == authority.key(),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

