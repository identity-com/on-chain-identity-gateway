#![deny(unaligned_references)]
#![allow(clippy::try_err)]

#[macro_use]
pub mod error;
pub mod state;
mod borsh;

use crate::{
    borsh as program_borsh,
    state::{GatewayToken, GatewayTokenState},
    error::GatewayError
};
use solana_program::{
    account_info::AccountInfo,
    pubkey::Pubkey,
    msg
};
use num_traits::AsPrimitive;

// Session gateway tokens, that have a lamport balance that exceeds this value, are rejected
const MAX_SESSION_TOKEN_BALANCE: u64 = 0;

pub struct Gateway {}
impl Gateway {
    /// Unpacks an account into a gateway token object
    fn parse_gateway_token(account_info: &AccountInfo) -> Result<GatewayToken, GatewayError> {
        program_borsh::try_from_slice_incomplete::<GatewayToken>(*account_info.data.borrow()).map_err(|_| GatewayError::InvalidToken)
    }

    /// Returns an error if the gateway token was NOT revoked
    pub fn expect_revoked_gateway_token(
        gateway_token: &GatewayToken,
    ) -> Result<(), GatewayError> {
        if gateway_token.state != GatewayTokenState::Revoked {
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
        );

        match gateway_token_result {
            Ok(gateway_token) => Self::expect_revoked_gateway_token(&gateway_token),
            Err(_) => gateway_token_result.map(|_| ())
        }
    }

    /// Verifies the gateway token belongs to the expected owner,
    /// is signed by the gatekeeper and is not revoked.
    pub fn verify_gateway_token(
        gateway_token: &GatewayToken,
        expected_owner: &Pubkey,
        expected_gatekeeper_network_key: &Pubkey,
        gateway_token_account_balance: u64,
    ) -> Result<(), GatewayError> {
        if *expected_owner != gateway_token.owner_wallet {
            msg!("Gateway token does not have the correct owner. Expected: {} Was: {}", *expected_owner, gateway_token.owner_wallet);
            return Err(GatewayError::InvalidOwner);
        }

        if *expected_gatekeeper_network_key != gateway_token.gatekeeper_network {
            msg!("Gateway token not issued by correct gatekeeper network");
            return Err(GatewayError::IncorrectGatekeeper);
        }

        if !gateway_token.is_vanilla() {
            msg!("Gateway token is of an invalid type. Only vanilla gateway tokens can be verified.");
            return Err(GatewayError::InvalidToken);
        }
        
        if gateway_token.is_session_token() && gateway_token_account_balance > MAX_SESSION_TOKEN_BALANCE {
            msg!("Gateway token is a session token, but has a lamport balance that would make it exceed the lifetime of the transaction.");
            return Err(GatewayError::InvalidSessionToken);
        }

        if !gateway_token.is_valid() {
            msg!("Gateway token is invalid. It has either been revoked or frozen, or has expired");
            return Err(GatewayError::TokenRevoked);
        }

        Ok(())
    }

    pub fn gateway_token_reference(
        gateway_token_info: &AccountInfo
    ) -> Result<Pubkey, GatewayError> {
        let gateway_token_result = Gateway::parse_gateway_token(
            gateway_token_info
        );

        match gateway_token_result {
            // Non-identity-linked token - the token key is the reference, identity-linked token - the parent token is the reference
            Ok(gateway_token) => Ok(gateway_token.parent_gateway_token.unwrap_or(*gateway_token_info.key)),
            Err(error) => Err(error)
        }
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
            gateway_token_info
        );

        match gateway_token_result {
            Ok(gateway_token) => Gateway::verify_gateway_token(
                &gateway_token,
                expected_owner,
                expected_gatekeeper_key,
                gateway_token_info.lamports.borrow().as_()
            ),
            Err(_) => gateway_token_result.map(|_| ())
        }
    }
}


// TODO
// #[cfg(test)]
// mod tests;
