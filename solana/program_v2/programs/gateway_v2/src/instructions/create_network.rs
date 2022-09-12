use crate::state::{GatekeeperNetwork, NetworkAuthKey, GatekeeperNetworkSize};
use crate::types::{NetworkFees, NetworkKeyFlags};
use crate::constants::NETWORK_SEED;
use crate::errors::CreateNetworkErrors;
use anchor_lang::prelude::*;

pub fn create_network(
    authority: Pubkey,
    bump: u8,
    data: CreateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
) -> Result<()> {
    // Check there are auth_keys provided (TODO: Is this necessary? The next check implies this)
    if data.auth_keys.is_empty() {
        return Err(error!(CreateNetworkErrors::NoAuthKeys));
    }

    // Check if there are enough auth_keys with the AUTH flag set
    if data
        .auth_keys
        .iter()
        .filter(|key| {
            NetworkKeyFlags::from_bits_truncate(key.flags).contains(NetworkKeyFlags::AUTH)
        })
        .count()
        < data.auth_threshold as usize
    {
        return Err(error!(CreateNetworkErrors::InsufficientAuthKeys));
    }

    network.auth_threshold = data.auth_threshold;
    network.initial_authority = authority;
    network.pass_expire_time = data.pass_expire_time;
    network.signer_bump = bump;
    network.auth_keys = data.auth_keys;
    network.fees = data.fees;

    Ok(())
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetworkAccount<'info> {
    #[account(
    init,
    payer = authority,
    space = GatekeeperNetwork::on_chain_size_with_arg(
    GatekeeperNetworkSize{
    fees_count: data.fees.len() as u16,
    auth_keys: data.auth_keys.len() as u16,
    }
    ),
    seeds = [NETWORK_SEED, authority.key().as_ref()],
    bump
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}