#![deny(unaligned_references)]
#![allow(clippy::try_err)]

#[macro_use]
pub mod error;
pub mod borsh;
pub mod instruction;
pub mod networks;
pub mod state;

#[cfg(test)]
mod test_utils;

use crate::instruction::expire_token;
use crate::state::{GatewayTokenAccess, GatewayTokenFunctions, InPlaceGatewayToken};
use crate::{
    borsh as program_borsh,
    error::GatewayError,
    state::{GatewayToken, GatewayTokenState},
};
use num_traits::AsPrimitive;
use solana_program::entrypoint_deprecated::ProgramResult;
use solana_program::program::invoke_unchecked;
use solana_program::program_error::ProgramError;
use solana_program::{account_info::AccountInfo, msg, pubkey::Pubkey};
use std::str::FromStr;

// Session gateway tokens, that have a lamport balance that exceeds this value, are rejected
const MAX_SESSION_TOKEN_BALANCE: u64 = 0;

/// Options to configure how a gateway token is considered valid. Typically, integrators should
/// use the default options.
#[derive(Copy, Clone, Debug, PartialEq, Default)]
pub struct VerificationOptions {
    /// If true, consider an expired token as invalid. Defaults to true
    pub check_expiry: bool,
    /// Number of seconds to allow a token to have expired by, for it still to be counted as active.
    /// Defaults to 0. Must be set if check_expiry is true.
    pub expiry_tolerance_seconds: Option<u32>,
}

pub const DEFAULT_VERIFICATION_OPTIONS: VerificationOptions = VerificationOptions {
    check_expiry: true,
    expiry_tolerance_seconds: Some(0),
};

pub struct Gateway {}
impl Gateway {
    fn program_id() -> Pubkey {
        Pubkey::from_str("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs").unwrap()
    }

    /// Unpacks an account into a gateway token object
    pub fn parse_gateway_token(account_info: &AccountInfo) -> Result<GatewayToken, GatewayError> {
        program_borsh::try_from_slice_incomplete::<GatewayToken>(*account_info.data.borrow())
            .map_err(|_| GatewayError::InvalidToken)
    }

    /// Returns an error if the gateway token was NOT revoked
    pub fn expect_revoked_gateway_token(gateway_token: &GatewayToken) -> Result<(), GatewayError> {
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
        let gateway_token_result = Gateway::parse_gateway_token(gateway_token_info);

        match gateway_token_result {
            Ok(gateway_token) => Self::expect_revoked_gateway_token(&gateway_token),
            Err(_) => gateway_token_result.map(|_| ()),
        }
    }

    /// Verifies the gateway token belongs to the expected owner,
    /// is signed by the gatekeeper and is not revoked.
    pub fn verify_gateway_token(
        gateway_token: &impl GatewayTokenAccess,
        expected_owner: &Pubkey,
        expected_gatekeeper_network_key: &Pubkey,
        gateway_token_account_balance: u64,
        options: Option<VerificationOptions>,
    ) -> Result<(), GatewayError> {
        let verification_options = options.unwrap_or(DEFAULT_VERIFICATION_OPTIONS);
        if expected_owner != gateway_token.owner_wallet() {
            msg!(
                "Gateway token does not have the correct owner. Expected: {} Was: {}",
                *expected_owner,
                gateway_token.owner_wallet()
            );
            return Err(GatewayError::InvalidOwner);
        }

        if expected_gatekeeper_network_key != gateway_token.gatekeeper_network() {
            msg!("Gateway token not issued by correct gatekeeper network");
            return Err(GatewayError::IncorrectGatekeeper);
        }

        if !gateway_token.is_vanilla() {
            msg!(
                "Gateway token is of an invalid type. Only vanilla gateway tokens can be verified."
            );
            return Err(GatewayError::InvalidToken);
        }

        if gateway_token.is_session_token()
            && gateway_token_account_balance > MAX_SESSION_TOKEN_BALANCE
        {
            msg!("Gateway token is a session token, but has a lamport balance that would make it exceed the lifetime of the transaction.");
            return Err(GatewayError::InvalidSessionToken);
        }

        if !gateway_token.is_valid_state() {
            msg!("Gateway token is invalid. It has either been revoked or frozen");
            return Err(GatewayError::TokenRevoked);
        }

        if verification_options.check_expiry
            && gateway_token.has_expired(verification_options.expiry_tolerance_seconds.unwrap_or(0))
        {
            msg!("Gateway token has expired");
            return Err(GatewayError::TokenExpired);
        }

        Ok(())
    }

    pub fn gateway_token_reference(
        gateway_token_info: &AccountInfo,
    ) -> Result<Pubkey, GatewayError> {
        let gateway_token_result = Gateway::parse_gateway_token(gateway_token_info);

        match gateway_token_result {
            // Non-identity-linked token - the token key is the reference, identity-linked token - the parent token is the reference
            Ok(gateway_token) => Ok(gateway_token
                .parent_gateway_token
                .unwrap_or(*gateway_token_info.key)),
            Err(error) => Err(error),
        }
    }

    /// Verifies the gateway token account parses to a valid gateway token,
    /// belongs to the expected owner,
    /// is signed by the gatekeeper,
    /// and is not revoked.
    pub fn verify_gateway_token_account_info(
        gateway_token_info: &AccountInfo,
        expected_owner: &Pubkey,
        expected_gatekeeper_key: &Pubkey,
        options: Option<VerificationOptions>,
    ) -> Result<(), GatewayError> {
        if gateway_token_info.owner.ne(&Gateway::program_id()) {
            msg!("Gateway token is not owned by gateway program");
            return Err(GatewayError::IncorrectProgramId);
        }

        let gateway_token_result = Gateway::parse_gateway_token(gateway_token_info);

        match gateway_token_result {
            Ok(gateway_token) => Gateway::verify_gateway_token(
                &gateway_token,
                expected_owner,
                expected_gatekeeper_key,
                gateway_token_info.lamports.borrow().as_(),
                options,
            ),
            Err(_) => gateway_token_result.map(|_| ()),
        }
    }

    pub fn verify_gateway_token_with_eval(
        gateway_token_info: &AccountInfo,
        expected_owner: &Pubkey,
        expected_gatekeeper_key: &Pubkey,
        options: Option<VerificationOptions>,
        eval_function: impl FnOnce(&InPlaceGatewayToken<&[u8]>) -> ProgramResult,
    ) -> ProgramResult {
        if gateway_token_info.owner.ne(&Gateway::program_id()) {
            msg!("Gateway token is not owned by gateway program");
            return Err(GatewayError::IncorrectProgramId.into());
        }

        let data = gateway_token_info.data.borrow();
        let gateway_token = InPlaceGatewayToken::new(&**data)?;

        eval_function(&gateway_token)?;

        Ok(Gateway::verify_gateway_token(
            &gateway_token,
            expected_owner,
            expected_gatekeeper_key,
            gateway_token_info.lamports.borrow().as_(),
            options,
        )?)
    }

    /// Verifies a given token and then expires it. Only works on networks that support this feature.
    pub fn verify_and_expire_token<'a>(
        gateway_program: AccountInfo<'a>,
        gateway_token_info: AccountInfo<'a>,
        owner: AccountInfo<'a>,
        gatekeeper_network: &Pubkey,
        expire_feature_account: AccountInfo<'a>,
    ) -> ProgramResult {
        Self::verify_and_expire_token_with_eval(
            gateway_program,
            gateway_token_info,
            owner,
            gatekeeper_network,
            expire_feature_account,
            |_| Ok(()),
        )
    }

    /// Verifies a given token, followed by a given evaluation function and then expires it. Only works on networks that support this feature.
    pub fn verify_and_expire_token_with_eval<'a>(
        gateway_program: AccountInfo<'a>,
        gateway_token_info: AccountInfo<'a>,
        owner: AccountInfo<'a>,
        gatekeeper_network: &Pubkey,
        expire_feature_account: AccountInfo<'a>,
        eval_function: impl FnOnce(&InPlaceGatewayToken<&[u8]>) -> ProgramResult,
    ) -> ProgramResult {
        let borrow = gateway_token_info.data.borrow();
        let gateway_token = InPlaceGatewayToken::new(&**borrow)?;

        eval_function(&gateway_token)?;

        if gateway_program.key != &Self::program_id() {
            msg!("Gateway token passed is not owned by gateway program");
            return Err(ProgramError::IncorrectProgramId);
        }

        if !gateway_token.is_valid() {
            msg!("Gateway token is invalid. It has either been revoked or frozen, or has expired");
            return Err(GatewayError::TokenRevoked.into());
        }
        drop(borrow);

        invoke_unchecked(
            &expire_token(*gateway_token_info.key, *owner.key, *gatekeeper_network),
            &[
                gateway_token_info,
                owner,
                expire_feature_account,
                gateway_program,
            ],
        )?;
        Ok(())
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::state::{get_expire_address_with_seed, get_gateway_token_address_with_seed};
    use crate::test_utils::test_utils_stubs::{init, now};
    use ::borsh::{BorshDeserialize, BorshSerialize};
    use std::{cell::RefCell, rc::Rc};

    fn expired_gateway_token() -> GatewayToken {
        let mut token = GatewayToken {
            features: 0,
            parent_gateway_token: None,
            owner_wallet: Default::default(),
            owner_identity: None,
            gatekeeper_network: Default::default(),
            issuing_gatekeeper: Default::default(),
            state: Default::default(),
            expire_time: None,
        };
        token.set_expire_time(0); // 1.1.1970 is definitely in the past
        token
    }

    #[test]
    fn verify_gateway_token_account_info_fails_on_incorrect_program_id() {
        let mut lamports = 0;
        let account_info = AccountInfo {
            key: &Default::default(),
            is_signer: false,
            is_writable: false,
            lamports: Rc::new(RefCell::new(&mut lamports)),
            data: Rc::new(RefCell::new(&mut [])),
            owner: &Default::default(),
            executable: false,
            rent_epoch: 0,
        };
        let verify_result = Gateway::verify_gateway_token_account_info(
            &account_info,
            &Default::default(),
            &Default::default(),
            None,
        );

        assert!(matches!(
            verify_result,
            Err(GatewayError::IncorrectProgramId)
        ))
    }

    #[test]
    fn verify_gateway_token_account_info_passes_an_expired_token_if_check_expiry_is_off() {
        init();
        let token = expired_gateway_token();
        let verify_result = Gateway::verify_gateway_token(
            &token,
            &Default::default(),
            &Default::default(),
            0,
            Some(VerificationOptions {
                check_expiry: false,
                ..Default::default()
            }),
        );

        assert!(matches!(verify_result, Ok(())))
    }

    #[test]
    fn verify_gateway_token_account_info_fails_an_expired_token_if_check_expiry_is_on() {
        init();
        let token = expired_gateway_token();
        let verify_result = Gateway::verify_gateway_token(
            &token,
            &Default::default(),
            &Default::default(),
            0,
            None,
        );

        assert!(matches!(verify_result, Err(GatewayError::TokenExpired)))
    }

    #[test]
    fn verify_gateway_token_account_info_passes_an_expired_token_if_it_is_within_tolerance() {
        init();
        let mut token = expired_gateway_token();
        token.set_expire_time(now() - 10);
        let verify_result = Gateway::verify_gateway_token(
            &token,
            &Default::default(),
            &Default::default(),
            0,
            Some(VerificationOptions {
                check_expiry: true,
                expiry_tolerance_seconds: Some(60),
            }),
        );

        assert!(matches!(verify_result, Ok(())))
    }

    struct EvalOut {
        result: ProgramResult,
        data: GatewayToken,
    }
    fn run_eval(
        mut token: GatewayToken,
        eval: impl FnOnce(&InPlaceGatewayToken<&[u8]>) -> ProgramResult,
    ) -> EvalOut {
        let owner = Pubkey::new_unique();
        token.owner_wallet = owner;
        let network = Pubkey::new_unique();
        token.gatekeeper_network = network;
        let gateway_token = get_gateway_token_address_with_seed(&owner, &None, &network);
        let expire = get_expire_address_with_seed(&network);
        let mut token_data = token.try_to_vec().unwrap();
        let result = Gateway::verify_and_expire_token_with_eval(
            AccountInfo::new(
                &Gateway::program_id(),
                false,
                false,
                &mut 1_000_000,
                &mut [],
                &Pubkey::new_from_array([0; 32]),
                true,
                0,
            ),
            AccountInfo::new(
                &gateway_token.0,
                false,
                true,
                &mut 1_000_000,
                &mut token_data,
                &Gateway::program_id(),
                false,
                0,
            ),
            AccountInfo::new(
                &owner,
                true,
                false,
                &mut 1_000_000,
                &mut [],
                &Pubkey::new_from_array([0; 32]),
                false,
                0,
            ),
            &network,
            AccountInfo::new(
                &expire.0,
                false,
                false,
                &mut 1_000_000,
                &mut [],
                &Gateway::program_id(),
                false,
                0,
            ),
            eval,
        );
        EvalOut {
            result,
            data: GatewayToken::deserialize(&mut token_data.as_slice()).unwrap(),
        }
    }

    #[test]
    fn verify_and_expire_gateway_token_with_func_should_fail() {
        init();
        let mut token = expired_gateway_token();
        token.expire_time = Some(now() + (1 << 10));

        const ERROR_CODE: u32 = 123456;
        let result = run_eval(token, |_| Err(ProgramError::Custom(ERROR_CODE)));
        assert_eq!(result.result, Err(ProgramError::Custom(ERROR_CODE)));
    }

    #[test]
    fn verify_and_expire_gateway_token_with_func_should_succeed() {
        init();
        let mut token = expired_gateway_token();
        token.expire_time = Some(now() + (1 << 10));

        let result = run_eval(token, |_| Ok(()));
        result.result.expect("Could not verify");
        assert!(result.data.expire_time.unwrap() < now());
    }
}
