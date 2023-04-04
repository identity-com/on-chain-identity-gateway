use anchor_lang::prelude::*;

use crate::constants::{GATEKEEPER_SEED, PASS_SEED};
use crate::state::{Gatekeeper, GatekeeperKeyFlags, GatekeeperState, Pass};

pub fn set_pass_data(
    ctx: Context<PassSetData>,
    gatekeeper_data: Option<[u8; 32]>,
    network_data: Option<[u8; 32]>,
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
pub struct PassSetData<'info> {
    #[account(
    seeds = [PASS_SEED, pass.subject.as_ref(), pass.network.key().as_ref(), & pass.pass_number.to_le_bytes() ],
    bump = pass.signer_bump,
    constraint = gatekeeper.can_access(& authority, GatekeeperKeyFlags::SET_PASS_DATA),
    mut
    )]
    pub pass: Account<'info, Pass>,
    pub authority: Signer<'info>,
    #[account(
    constraint = pass.gatekeeper == gatekeeper.key(),
    constraint = gatekeeper.gatekeeper_state != GatekeeperState::Halted,
    seeds = [GATEKEEPER_SEED, gatekeeper.subject.as_ref(), gatekeeper.gatekeeper_network.as_ref()],
    bump = gatekeeper.gatekeeper_bump
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
}
