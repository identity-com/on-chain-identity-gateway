//! Utility functions and types.
use crate::state::{GatekeeperFees, NetworkFees};
use anchor_lang::prelude::Pubkey;
use std::ops::{Div, Mul};

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

pub fn get_gatekeeper_fees(fees: &[GatekeeperFees], mint: Pubkey) -> &GatekeeperFees {
    fees.iter().find(|&&x| x.token == mint).unwrap()
}

pub fn get_network_fees(fees: &[NetworkFees], mint: Pubkey) -> &NetworkFees {
    fees.iter().find(|&&x| x.token == mint).unwrap()
}

/// calculate_network_and_gatekeeper_fee
/// Returns two fees in the correct unit
/// First result returns the fee for the network_fee
/// Second result returns the gatekeeper fee
pub fn calculate_network_and_gatekeeper_fee(fee: u64, split: u16) -> (u64, u64) {
    let percentage = (split as f64).div(100_f64);
    let network_fee = (fee as f64).mul(percentage);

    let gatekeeper_fee = (fee as f64) - network_fee;
    (network_fee as u64, gatekeeper_fee as u64)
}

#[cfg(test)]
mod tests {
    use crate::state::{GatekeeperFees, NetworkFees};

    #[test]
    fn get_fees_test() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(100, 10);
        assert_eq!(fees.0, 10);
        assert_eq!(fees.1, 90);
    }

    #[test]
    fn get_fees_test_split_5() {
        let fees = crate::util::calculate_network_and_gatekeeper_fee(100, 5);
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
        let fee = crate::util::get_gatekeeper_fees(&fees, mint);
        assert_eq!(fee, &fee1);
    }

    #[test]
    fn get_network_fees() {
        let mint = "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtveqn4esJGX"
            .parse()
            .unwrap();
        let fee1 = NetworkFees {
            token: mint,
            issue: 100,
            verify: 10,
            refresh: 10,
            expire: 10,
        };
        let fee2 = NetworkFees {
            token: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
            issue: 0,
            verify: 0,
            refresh: 0,
            expire: 0,
        };
        let fees: Vec<NetworkFees> = vec![fee1, fee2];
        let fee = crate::util::get_network_fees(&fees, mint);
        assert_eq!(fee, &fee1);
    }
}
