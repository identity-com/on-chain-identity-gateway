use crate::account::GatekeeperNetwork;
use crate::{CreateNetworkData, NetworkKeyFlags};
use anchor_lang::prelude::*;

#[derive(Debug)]
pub struct CreateNetwork {}

impl CreateNetwork {
    pub fn process(
        data: CreateNetworkData,
        network: &mut Account<GatekeeperNetwork>,
    ) -> Result<()> {
        if data.auth_keys.is_empty() {
            return Err(error!(ErrorCode::NoAuthKeys));
        }
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
        network.pass_expire_time = data.pass_expire_time;
        network.network_data_len = data.network_data_len;
        network.signer_bump = data.signer_bump;
        network.auth_keys_count = data.auth_keys.len() as u16;
        network.auth_keys = data.auth_keys;
        network.fees_count = data.fees.len() as u16;
        network.fees = data.fees;

        msg!("Expire time {}", network.pass_expire_time);

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
