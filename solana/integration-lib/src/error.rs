//! Error types

use {
    num_derive::FromPrimitive,
    solana_program::{decode_error::DecodeError, program_error::ProgramError},
    thiserror::Error,
};

/// Errors that may be returned by the program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum GatewayError {
    /// The gatekeeper listed in the gateway token is not accepted
    #[error("The gatekeeper listed in the gateway token is not accepted")]
    IncorrectGatekeeper,

    /// The gateway token's owner is not the account placing the order
    #[error("The gateway token's owner is not the account placing the order")]
    InvalidOwner,

    /// The gateway token account is not of the correct type
    #[error("The gateway token account is not of the correct type")]
    InvalidToken,

    /// The gateway token is a session token, but has a lamport balance that would make it exceed the lifetime of the transaction.
    #[error("The gateway token is a session token, but has a lamport balance that would make it exceed the lifetime of the transaction.")]
    InvalidSessionToken,

    /// The gateway token was revoked
    #[error("The gateway token was revoked")]
    TokenRevoked,

    /// The gateway token was expected to be revoked, but was not
    #[error("The gateway token was expected to be revoked, but was not")]
    ExpectedRevokedToken,

    /// The gatway token could not be changed into the requested state
    #[error("Invalid state change")]
    InvalidStateChange,

    /// The account is not owned by the gateway program
    #[error("The account is not owned by the gateway program")]
    IncorrectProgramId,
}
impl From<GatewayError> for ProgramError {
    fn from(e: GatewayError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for GatewayError {
    fn type_of() -> &'static str {
        "Gateway Error"
    }
}
