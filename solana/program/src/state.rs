//! Program state
use {
    crate::id,
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey
    }
};

/// A Gatekeeper account
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Gatekeeper {
    /// The public key of the owner of the gatekeeper account  
    pub authority: Pubkey,

    /// The public key of the network to which this gatekeeper belongs  
    pub network: Pubkey,
}

/// The seed string used to derive a program address for a gateway token from an owner account
pub const GATEWAY_TOKEN_ADDRESS_SEED: & [u8; 7] = br"gateway";

/// An optional seed to use when generating a gateway token,
/// allowing multiple gateway tokens per wallet
pub type AddressSeed = [u8;8];

/// Get program-derived gateway address for the authority
pub fn get_gateway_token_address_with_seed(authority: &Pubkey, additional_seed: &Option<AddressSeed>) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&authority.to_bytes(), GATEWAY_TOKEN_ADDRESS_SEED, &additional_seed.unwrap_or_default()], 
        &id())
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::borsh as program_borsh;


}
