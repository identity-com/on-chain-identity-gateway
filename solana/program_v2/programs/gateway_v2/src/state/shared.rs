use anchor_lang::prelude::*;
use solana_program::pubkey::Pubkey;

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, Copy, Eq, PartialEq, InitSpace)]
pub struct AuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}
