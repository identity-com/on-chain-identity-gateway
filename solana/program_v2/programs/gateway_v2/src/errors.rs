use anchor_lang::prelude::*;

#[error_code]
pub enum NetworkErrors {
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
    #[msg("Invalid key provided")]
    InvalidKey,
    #[msg("The network account is in use")]
    AccountInUse,
}

#[error_code]
pub enum GatekeeperErrors {
    #[msg("No auth keys provided")]
    NoAuthKeys,
    #[msg("Not enough auth keys provided")]
    InsufficientAuthKeys,
    #[msg("Insufficient access to update auth keys")]
    InsufficientAccessAuthKeys,
    #[msg("Auth key not found")]
    AuthKeyNotFound,
    #[msg("Invalid key provided")]
    InvalidKey,
    #[msg("Gatekeeper not found")]
    InvalidGatekeeper,
}
