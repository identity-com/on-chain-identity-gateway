//! Utility functions and types.
use std::ops::{Div, Mul};

use anchor_lang::{Key, ToAccountInfo};
use anchor_lang::prelude::{Account, Program, Pubkey, Signer};
use anchor_spl::token::{Token, TokenAccount};
use solana_program::entrypoint::ProgramResult;
use solana_program::msg;
use solana_program::program::invoke;
use spl_token::instruction::transfer;

use crate::errors::{GatekeeperErrors, NetworkErrors};
use crate::state::{AuthKey, GatekeeperFees, GatekeeperKeyFlags, NetworkFeesPercentage};

// pub const OC_SIZE_BOOL: usize = 1;
pub const OC_SIZE_U8: usize = 1;
pub const OC_SIZE_U16: usize = 2;
pub const OC_SIZE_U32: usize = 4;
pub const OC_SIZE_U64: usize = 8;
// pub const OC_SIZE_U128: usize = 16;
pub const OC_SIZE_PUBKEY: usize = 32;
pub const OC_SIZE_VEC_PREFIX: usize = 4;
// pub const OC_SIZE_STRING_PREFIX: usize = 4;
pub const OC_SIZE_DISCRIMINATOR: usize = 8;
// pub const OC_SIZE_TIMESTAMP: usize = 8;

/// This value has as static size on-chain
pub trait OnChainSize {
    /// The size on-chain
    const ON_CHAIN_SIZE: usize;
}

/// Theis value can be sized with a given argument
pub trait OnChainSizeWithArg<Arg> {
    /// Gets the size with an argument
    fn on_chain_size_with_arg(arg: Arg) -> usize;
}

pub fn get_gatekeeper_fees(
    fees: &[GatekeeperFees],
    mint: Pubkey,
) -> Result<&GatekeeperFees, GatekeeperErrors> {
    fees.iter()
        .find(|&&x| x.token == mint)
        .ok_or(GatekeeperErrors::FeesNotProvided)
}

pub fn get_network_fees(
    fees: &[NetworkFeesPercentage],
    mint: Pubkey,
) -> Result<&NetworkFeesPercentage, NetworkErrors> {
    fees.iter()
        .find(|&&x| x.token == mint)
        .ok_or(NetworkErrors::FeesNotProvided)
}

/// calculate_network_and_gatekeeper_fee
/// Returns two fees in the correct unit
/// First result returns the fee for the network_fee
/// Second result returns the gatekeeper fee
pub fn calculate_network_and_gatekeeper_fee(fee: u64, percent: u16) -> (u64, u64) {
    let percent = if percent > 10000 { 10000 } else { percent };
    let percentage = (percent as f64).div(10000_f64);
    let network_fee = (fee as f64).mul(percentage);

    let gatekeeper_fee = (fee) - (network_fee as u64);
    (network_fee as u64, gatekeeper_fee)
}

pub fn create_and_invoke_transfer<'a>(
    spl_token_address: Program<'a, Token>,
    source_account: Account<'a, TokenAccount>,
    destination_account: Account<'a, TokenAccount>,
    authority_account: Signer<'a>,
    signer_pubkeys: &[&Pubkey],
    amount: u64,
) -> ProgramResult {
    let transfer_instruction_network_result = transfer(
        &spl_token_address.key(),
        &source_account.key(),
        &destination_account.key(),
        &authority_account.key(),
        signer_pubkeys,
        amount,
    )?;

    invoke(
        &transfer_instruction_network_result,
        &[
            source_account.to_account_info(),
            destination_account.to_account_info(),
            authority_account.to_account_info(),
            spl_token_address.to_account_info(),
        ],
    )
}

pub fn check_gatekeeper_auth_threshold(auth_keys: &Vec<AuthKey>, auth_threshold: u8) -> bool {
    let auth_key_count = auth_keys
        .iter()
        .filter(|key| GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(GatekeeperKeyFlags::AUTH))
        .count();

    msg!("COUNT {} {} ", auth_key_count, auth_threshold);
    auth_key_count >= auth_threshold as usize
}

#[cfg(test)]
mod tests {
    use crate::state::{AuthKey, GatekeeperFees, GatekeeperKeyFlags, NetworkFeesPercentage};
    use crate::util::check_gatekeeper_auth_threshold;

    #[test]
    fn get_fees_test_split_100() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(100, 10000);
        assert_eq!(fees.0, 100);
        assert_eq!(fees.1, 0);
    }

    #[test]
    fn get_fees_test() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(10000, 500);
        assert_eq!(fees.0, 500);
        assert_eq!(fees.1, 9500);
    }

    #[test]
    fn get_fees_test_split_5() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(100, 500);
        assert_eq!(fees.0, 5);
        assert_eq!(fees.1, 95);
    }

    #[test]
    fn get_fees_test_split_zero() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(100, 0);
        assert_eq!(fees.0, 0);
        assert_eq!(fees.1, 100);
    }

    #[test]
    fn get_gatekeeper_fees_test() {
        let mint = "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtveqn4esJGX"
            .parse()
            .unwrap();
        let fee1 = GatekeeperFees {
            token: mint,
            issue: 100,
            verify: 10,
            refresh: 10,
            expire: 10,
        };
        let fee2 = GatekeeperFees {
            token: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            issue: 0,
            verify: 0,
            refresh: 0,
            expire: 0,
        };
        let fees: Vec<GatekeeperFees> = vec![fee1, fee2];
        let fee = crate::util::get_gatekeeper_fees(&fees, mint).unwrap();
        assert_eq!(fee, &fee1);
    }

    #[test]
    fn get_network_fees() {
        let mint = "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtveqn4esJGX"
            .parse()
            .unwrap();
        let fee1 = NetworkFeesPercentage {
            token: mint,
            issue: 100,
            verify: 10,
            refresh: 10,
            expire: 10,
        };
        let fee2 = NetworkFeesPercentage {
            token: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            issue: 0,
            verify: 0,
            refresh: 0,
            expire: 0,
        };
        let fees: Vec<NetworkFeesPercentage> = vec![fee1, fee2];
        let fee = crate::util::get_network_fees(&fees, mint).unwrap();
        assert_eq!(fee, &fee1);
    }

    #[test]
    fn valid_auth_threshold() {
        let key1 = AuthKey {
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            //TODO: Why we cannot pass GatekeeperKeyFlags::Auth ??
            flags: 1,
        };

        let key2 = AuthKey {
            key: "3XfJXLJm3YUgoroxNQeo5yxLPd4SYC4W9usQwDi2n4Dd"
                .parse()
                .unwrap(),
            flags: 1,
        };

        let auth_keys = vec![key1, key2];
        let valid = check_gatekeeper_auth_threshold(&auth_keys, 2);

        assert_eq!(valid, true);
    }

    #[test]
    fn invalid_auth_threshold() {
        let key1 = AuthKey {
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            flags: 1,
        };

        let key2 = AuthKey {
            key: "3XfJXLJm3YUgoroxNQeo5yxLPd4SYC4W9usQwDi2n4Dd"
                .parse()
                .unwrap(),
            flags: 1,
        };

        let auth_keys = vec![key1, key2];
        let valid = check_gatekeeper_auth_threshold(&auth_keys, 3);

        assert_eq!(valid, false);
    }

    #[test]
    fn no_auth_threshold() {
        let key = AuthKey {
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            flags: 0,
        };


        let auth_keys = vec![key];
        let valid = check_gatekeeper_auth_threshold(&auth_keys, 1);

        assert_eq!(valid, false);
    }
}
