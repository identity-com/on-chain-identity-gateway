use anchor_lang::prelude::*;

use crate::errors::NetworkErrors;
use crate::state::{
    AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken,
};

pub fn update_network(ctx: Context<UpdateNetworkAccount>, data: &UpdateNetworkData) -> Result<()> {
    let network = &mut ctx.accounts.network;

    // Only set the expire time if a new one is provided
    if let Some(pass_expire_time) = data.pass_expire_time {
        network.set_expire_time(pass_expire_time)?;
    }

    network.update_auth_keys(&data.auth_keys, &ctx.accounts.authority)?;
    network.update_fees(&data.fees)?;
    network.update_network_features(data.network_features)?;
    network.update_supported_tokens(&data.supported_tokens)?;

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

impl UpdateNetworkData {
    fn can_update_auth_keys(&self, network: &GatekeeperNetwork, authority: &Signer) -> bool {
        (self.auth_keys.remove.len() == 0 && self.auth_keys.add.len() == 0)
            || network.can_access(&authority, NetworkKeyFlags::AUTH)
    }

    fn can_update_fees(&self, network: &GatekeeperNetwork, authority: &Signer) -> bool {
        (self.fees.add.len() == 0 && self.fees.remove.len() == 0)
            || network.can_access(&authority, NetworkKeyFlags::ADJUST_FEES)
    }

    fn can_update_expiry(&self, network: &GatekeeperNetwork, authority: &Signer) -> bool {
        match self.pass_expire_time {
            None => false,
            Some(expiry) => {
                network.pass_expire_time == expiry || network.can_access(&authority, NetworkKeyFlags::SET_EXPIRE_TIME)
            }
        }
    }

    fn can_update_features(&self, network: &GatekeeperNetwork, authority: &Signer) -> bool {
        self.network_features == network.network_features || network.can_access(&authority, NetworkKeyFlags::SET_FEATURES)
    }

    fn can_update_tokens(&self, network: &GatekeeperNetwork, authority: &Signer) -> bool {
        (self.supported_tokens.add.len() == 0 && self.supported_tokens.remove.len() == 0)
            || network.can_access(&authority, NetworkKeyFlags::UPDATE_TOKENS)
    }
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
    pub add: Vec<AuthKey>,
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
    realloc::payer = payer,
    realloc::zero = false,
    constraint = data.can_update_expiry(& network, & authority) @ NetworkErrors::InsufficientAccessExpiry,
    constraint = data.can_update_auth_keys(& network, & authority) @ NetworkErrors::InsufficientAccessAuthKeys,
    constraint = data.can_update_fees(& network, & authority) @ NetworkErrors::InsufficientAccessFees,
    constraint = data.can_update_features(& network, & authority) @ NetworkErrors::InsufficientAccessFeatures,
    constraint = data.can_update_tokens(& network, & authority) @ NetworkErrors::InsufficientAccessTokens,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
