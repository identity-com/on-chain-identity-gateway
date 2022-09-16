use crate::constants::NETWORK_SEED;
use crate::state::{GatekeeperNetwork, GatekeeperNetworkSize, NetworkFees};
use crate::NetworkAuthKey;
use anchor_lang::prelude::*;

pub fn update_gatekeeper(
    data: &UpdateGatekeeperData,
    gatekeeper: &mut Account<Gatekeeper>,
    authority: &mut Signer,
) -> Result<()> {
    gatekeeper.add_auth_keys(data, authority)?;
    gatekeeper.add_fees(data, authority)?;
    gatekeeper.set_auth_threshold(data, authority)?;
    gatekeeper.set_network(data, authority)?;
    gatekeeper.set_addresses(data, authority)?;
    gatekeeper.set_staking_account(data, authority)?;

    Ok(())
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGatekeeperData {
    /// The number of keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Pubkey,
    /// A pointer to the addresses this gatekeeper uses for discoverability
    pub addresses: Pubkey,
    /// The staking account of this gatekeeper
    pub staking_account: Pubkey,
    /// The fees for this gatekeeper
    pub fees: Vec<GatekeeperFees>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<GatekeeperAuthKey>,
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
#[instruction(data: UpdateGatekeeperData)]
pub struct UpdateGatekeeperAccount<'info> {
    #[account(
        mut,
        realloc = Gatekeeper::on_chain_size_with_arg(
            GatekeeperSize{
                fees_count: (gatekeeper.fees.len() + data.fees.add.len() - data.fees.remove.len()) as u16,
                auth_keys: (gatekeeper.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len()) as u16,
            }
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [GATEKEEPER_SEED, gatekeeper.initial_authority.key().as_ref()],
        bump = gatekeeper.signer_bump,
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
