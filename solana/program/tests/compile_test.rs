#![allow(dead_code)]

use borsh::{BorshDeserialize, BorshSerialize, BorshSchema};
use solana_program::pubkey::Pubkey;

#[derive(BorshDeserialize, BorshSerialize, BorshSchema)]
struct CheckBorsh{
    key: Pubkey
}
