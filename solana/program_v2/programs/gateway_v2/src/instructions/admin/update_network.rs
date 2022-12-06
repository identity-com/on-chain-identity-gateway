use crate::state::{GatekeeperNetwork, NetworkAuthKey, NetworkFeesPercentage, SupportedToken};
use anchor_lang::prelude::*;

pub fn update_network(ctx: Context<UpdateNetworkAccount>, data: &UpdateNetworkData) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let authority = &mut ctx.accounts.authority;

    network.set_expire_time(data, authority)?;
    network.update_auth_keys(data, authority)?;
    network.update_fees(data, authority)?;
    network.update_network_features(data, authority)?;
    network.update_supported_tokens(data, authority)?;

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
    /// The [`GatekeeperNetwork::network_features`].
    pub network_features: u32,
    /// The [`GatekeeperNetwork::supported_tokens`].
    pub supported_tokens: UpdateSupportedTokens,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateSupportedTokens {
    pub add: Vec<SupportedToken>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateGatekeepers {
    pub add: Vec<Pubkey>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateFees {
    pub add: Vec<NetworkFeesPercentage>,
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
    realloc = GatekeeperNetwork::size(
    network.fees.len() + data.fees.add.len() - data.fees.remove.len(),
    network.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len(),
    network.gatekeepers.len(),
    network.supported_tokens.len() + data.supported_tokens.add.len() - data.supported_tokens.remove.len()
    ),
    realloc::payer = authority,
    realloc::zero = false,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
