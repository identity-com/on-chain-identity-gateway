#![deny(unaligned_references)]
#![allow(clippy::try_err)]

#[macro_use]
pub mod error;

use spl_token::{
    state::{Account, AccountState},
};
use solana_program::{
    account_info::AccountInfo,
    pubkey::Pubkey,
    program_pack::Pack,
    msg
};

use solana_program::program_error::ProgramError;
use crate::error::GatewayError;

pub struct Gateway {}
impl Gateway {
    #[inline]
    fn gateway_token_program_id() -> Pubkey {
        spl_token::id()
    }

    /// Unpacks a spl_token `Account`.
    fn unpack_token_account(
        account_info: &AccountInfo,
        token_program_id: &Pubkey,
    ) -> Result<Account, ProgramError> {
        if account_info.owner != token_program_id {
            Err(ProgramError::IncorrectProgramId)
        } else {
            Account::unpack(&account_info.data.borrow())
                .map_err(|_| ProgramError::InvalidAccountData)
        }
    }

    /// Unpacks an account into a gateway token object
    /// NOTE - currently a gateway token is represented as an spl token 
    fn parse_gateway_token(account_info: &AccountInfo,
                           program_id: &Pubkey) -> Result<Account, GatewayError> {
        Self::unpack_token_account(account_info, program_id).or(Err(GatewayError::InvalidToken))
    }

    fn gateway_token_valid_state(
        gateway_token: &Account,
    ) -> bool {
        gateway_token.state != AccountState::Frozen
    }

    /// Returns an error if the gateway token was NOT revoked
    pub fn expect_revoked_gateway_token(
        gateway_token: &Account,
    ) -> Result<(), GatewayError> {
        if Self::gateway_token_valid_state(gateway_token) {
            msg!("Gateway token has not been revoked");
            return Err(GatewayError::ExpectedRevokedToken);
        }

        Ok(())
    }

    /// Returns an error if the gateway token was NOT revoked
    pub fn expect_revoked_gateway_token_account_info(
        gateway_token_info: &AccountInfo,
    ) -> Result<(), GatewayError> {
        let gateway_token_result = Gateway::parse_gateway_token(
            gateway_token_info,
            &Gateway::gateway_token_program_id()
        );

        match gateway_token_result {
            Ok(gateway_token) => Self::expect_revoked_gateway_token(&gateway_token),
            Err(_) => gateway_token_result.map(|_| ())
        }
    }

    /// Verifies the gateway token belongs to the expected owner,
    /// is signed by the gatekeeper and is not revoked.
    pub fn verify_gateway_token(
        gateway_token: &Account,
        expected_owner: &Pubkey,
        expected_gatekeeper_key: &Pubkey,
    ) -> Result<(), GatewayError> {
        if *expected_owner != gateway_token.owner {
            msg!("Gateway token does not have the correct owner. Expected: {} Was: {}", *expected_owner, gateway_token.owner);
            return Err(GatewayError::InvalidOwner);
        }

        if *expected_gatekeeper_key != gateway_token.mint {
            msg!("Gateway token not issued by correct gatekeeper");
            return Err(GatewayError::IncorrectGatekeeper);
        }

        if !Self::gateway_token_valid_state(gateway_token) {
            msg!("Gateway token has been revoked");
            return Err(GatewayError::TokenRevoked);
        }

        Ok(())
    }

    /// Verifies the gateway token accout parses to a valid gateway token,
    /// belongs to the expected owner,
    /// is signed by the gatekeeper,
    /// and is not revoked.
    pub fn verify_gateway_token_account_info(
        gateway_token_info: &AccountInfo,
        expected_owner: &Pubkey,
        expected_gatekeeper_key: &Pubkey,
    )  -> Result<(), GatewayError> {
        let gateway_token_result = Gateway::parse_gateway_token(
            gateway_token_info,
            &Gateway::gateway_token_program_id()
        );

        match gateway_token_result {
            Ok(gateway_token) => Gateway::verify_gateway_token(&gateway_token, expected_owner, expected_gatekeeper_key),
            Err(_) => gateway_token_result.map(|_| ())
        }
    }
}


// TODO
// #[cfg(test)]
// mod tests;
