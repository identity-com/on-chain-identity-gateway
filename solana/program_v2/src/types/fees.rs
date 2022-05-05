use crate::types::OptionalNonSystemPubkey;
use cruiser::prelude::*;

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, InPlace)]
pub struct NetworkFees {
    /// The token for the fee, `None` means fee is invalid
    pub token: OptionalNonSystemPubkey,
    /// Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).
    pub issue: u16,
    /// Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).
    pub refresh: u16,
    /// Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).
    pub expire: u16,
    /// Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).
    pub verify: u16,
}
impl const OnChainSize for NetworkFees {
    const ON_CHAIN_SIZE: usize = OptionalNonSystemPubkey::ON_CHAIN_SIZE + u16::ON_CHAIN_SIZE * 4;
}

/// The fees a gatekeeper/network can take
#[derive(Debug, Clone, Eq, PartialEq, BorshSerialize, BorshDeserialize, InPlace)]
pub struct GatekeeperFees {
    /// The token for these fees. None value for this means native SOL price
    pub token: OptionalNonSystemPubkey,
    /// Fees taken at issuance of a new pass in token units or lamports for SOL.
    pub issue: u64,
    /// Fees taken when a pass is refreshed in token units or lamports for SOL.
    pub refresh: u64,
    /// The fee taken when a pass is expired in token units or lamports for SOL.
    /// This should only be used where pass value comes from one-time use.
    pub expire: u64,
    /// The fee taken when a pass is verified in token units or lamports for SOL.
    /// This should only be used where pass value comes from proper use
    pub verify: u64,
}
impl const OnChainSize for GatekeeperFees {
    const ON_CHAIN_SIZE: usize = OptionalNonSystemPubkey::ON_CHAIN_SIZE + u64::ON_CHAIN_SIZE * 4;
}
