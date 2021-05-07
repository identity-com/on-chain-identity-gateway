//! Error types

use {
    num_derive::FromPrimitive,
    solana_program::{
        decode_error::DecodeError, program_error::ProgramError,
    },
    thiserror::Error,
};

/// Errors that may be returned by the program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum SolariumError {
    /// Incorrect authority provided on delete
    #[error("Incorrect authority provided on delete")]
    IncorrectAuthority,

    /// Calculation overflow
    #[error("Calculation overflow")]
    Overflow,
}
impl From<SolariumError> for ProgramError {
    fn from(e: SolariumError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
// impl From<ParsePubkeyError> for SolariumError {
//     fn from(_e: ParsePubkeyError) -> Self {
//         SolError::InvalidString
//     }
// }
impl<T> DecodeError<T> for SolariumError {
    fn type_of() -> &'static str {
        "Solarium Error"
    }
}
