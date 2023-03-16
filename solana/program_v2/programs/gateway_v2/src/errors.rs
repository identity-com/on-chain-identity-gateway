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
    #[msg("Insufficient access to set features")]
    InsufficientAccessFeatures,
    #[msg("Insufficient access to set supported tokens")]
    InsufficientAccessTokens,
    #[msg("Insufficient access to set fees")]
    InsufficientAccessFees,
    #[msg("Insufficient access to create gatekeeper")]
    InsufficientAccessCreateGatekeeper,
    #[msg("Auth key not found")]
    AuthKeyNotFound,
    #[msg("Invalid key provided")]
    InvalidKey,
    #[msg("The network account is in use")]
    AccountInUse,
    #[msg("Network Fee was not provided")]
    FeesNotProvided,
    #[msg("Network Fee more than 100%")]
    NetworkFeeOutOfBounds,
    #[msg("Token not supported")]
    TokenNotSupported,
    #[msg("A network feature is not enabled for this instruction")]
    UnsupportedNetworkFeature,
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
    #[msg("Gatekeeper Fee was not provided")]
    FeesNotProvided,
    #[msg("Invalid gatekeeper state for the operation")]
    InvalidState,
}

#[error_code]
pub enum PassErrors {
    #[msg("Invalid state change")]
    InvalidStateChange,
    #[msg("The pass is not active")]
    PassNotActive,
    #[msg("Invalid gatekeeper")]
    InvalidGatekeeper,
    #[msg("Invalid network")]
    InvalidNetwork,
    #[msg("The pass is not active or has expired")]
    InvalidPass,
}
