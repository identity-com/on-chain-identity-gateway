use crate::account::GatekeeperNetwork;
use crate::{CreateNetworkData, NetworkKeyFlags};
use anchor_lang::prelude::*;

#[derive(Debug)]
pub struct CreateNetwork {}

impl CreateNetwork {
    pub fn process(
        authority: Pubkey,
        bump: u8,
        data: CreateNetworkData,
        network: &mut Account<GatekeeperNetwork>,
    ) -> Result<()> {
        // Check there are auth_keys provided (TODO: Is this necessary? The next check implies this)
        if data.auth_keys.is_empty() {
            return Err(error!(ErrorCode::NoAuthKeys));
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
            return Err(error!(ErrorCode::InsufficientAuthKeys));
        }

        network.auth_threshold = data.auth_threshold;
        network.initial_authority = authority;
        network.pass_expire_time = data.pass_expire_time;
        network.signer_bump = bump;
        network.auth_keys = data.auth_keys;
        network.fees = data.fees;

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("No auth keys provided")]
    NoAuthKeys,
    #[msg("Not enough auth keys provided")]
    InsufficientAuthKeys,
    #[msg("Insufficient access to update auth keys")]
    InsufficientAccessAuthKeys,
    #[msg("Insufficient access to set expiry time")]
    InsufficientAccessExpiry,
    #[msg("Auth key not found")]
    AuthKeyNotFound,
}
