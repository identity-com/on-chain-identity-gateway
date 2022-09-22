use crate::constants::NETWORK_SEED;
use crate::state::{GatekeeperNetwork, GatekeeperNetworkSize, NetworkAuthKey, NetworkFees};
use anchor_lang::prelude::*;

pub fn update_network(
    data: &UpdateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
    authority: &mut Signer,
) -> Result<()> {
    // Runs the following methods on the passed-in network in order to update its parameters
    network.set_expire_time(data, authority)?;
    network.add_auth_keys(data, authority)?;
    network.add_fees(data, authority)?;

    Ok(())
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: Option<i64>,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: UpdateFees,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: UpdateKeys,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateFees {
    pub add: Vec<NetworkFees>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateKeys {
    pub add: Vec<NetworkAuthKey>,
    pub remove: Vec<Pubkey>,
}

#[derive(Accounts, Debug)]
#[instruction(data: UpdateNetworkData)]
pub struct UpdateNetworkAccount<'info> {
    #[account(
        mut,
        realloc = GatekeeperNetwork::on_chain_size_with_arg(
            GatekeeperNetworkSize{
                fees_count: (network.fees.len() + data.fees.add.len() - data.fees.remove.len()) as u16,
                auth_keys: (network.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len()) as u16,
            }
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
