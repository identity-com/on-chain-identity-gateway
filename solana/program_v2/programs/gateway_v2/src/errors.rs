use anchor_lang::prelude::*;

#[error_code]
pub enum CreateNetworkErrors {
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


