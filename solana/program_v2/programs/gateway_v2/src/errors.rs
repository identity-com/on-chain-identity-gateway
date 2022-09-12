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
}

// #[error_code]
// pub enum UpdateNetworkErrors {
//     #[msg("No auth keys provided")]
//     NoAuthKeys,
//     #[msg("Not enough auth keys provided")]
//     InsufficientAuthKeys,
//     #[msg("Invalid key provided")]
//     InvalidKey,
//     #[msg("Insufficient access to update auth keys")]
//     InsufficientAccessAuthKeys,
//     #[msg("Insufficient access to set expiry time")]
//     InsufficientAccessExpiry,
//     #[msg("Auth key not found")]
//     AuthKeyNotFound,
// }
