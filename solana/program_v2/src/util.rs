//! Utility functions and types.

use cruiser::on_chain_size::OnChainSize;
use cruiser::solana_program::program_memory::sol_memcmp;
use cruiser::Pubkey;

/// A public key that uses the system program as the [`None`] value
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OptionalNonSystemPubkey(Pubkey);
impl From<OptionalNonSystemPubkey> for Option<Pubkey> {
    fn from(from: OptionalNonSystemPubkey) -> Self {
        if sol_memcmp(from.0.as_ref(), &[0; 32], 32) == 0 {
            None
        } else {
            Some(from.0)
        }
    }
}
impl From<Pubkey> for OptionalNonSystemPubkey {
    fn from(from: Pubkey) -> Self {
        Self(from)
    }
}
impl OnChainSize<()> for OptionalNonSystemPubkey {
    fn on_chain_max_size(arg: ()) -> usize {
        Pubkey::on_chain_max_size(arg)
    }
}
