use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use solana_program::pubkey::Pubkey;

use crate::util::{OC_SIZE_PUBKEY, OC_SIZE_U16, OnChainSize};

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, Copy)]
pub struct AuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}

impl OnChainSize for AuthKey {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16 + OC_SIZE_PUBKEY;
}