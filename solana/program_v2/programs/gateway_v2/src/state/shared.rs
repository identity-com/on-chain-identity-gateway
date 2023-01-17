use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_program::pubkey::Pubkey;

use crate::util::{OnChainSize, OC_SIZE_PUBKEY, OC_SIZE_U16};

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, Copy, Eq, PartialEq)]
pub struct AuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}

impl OnChainSize for AuthKey {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16 + OC_SIZE_PUBKEY;
}
