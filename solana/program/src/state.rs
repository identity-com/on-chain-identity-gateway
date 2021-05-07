//! Program state
use {
    crate::id,
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey,
        program_pack::IsInitialized,
        msg,
    },
    std::{
        collections::VecDeque
    },
};

/// Struct wrapping data and providing metadata
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct GatewayToken {
    /// The public key of the owner of the inbox  
    pub owner: Pubkey,
}

impl GatewayToken {
    /// Create a new inbox
    pub fn new(owner: Pubkey) -> Self {
        Self {
            owner,
        }
    }
}

impl IsInitialized for GatewayToken {
    /// Is initialized
    fn is_initialized(&self) -> bool {
        !self.owner.to_bytes().is_empty()
    }
}


/// The seed string used to derive a program address for a gateway token from an owner account
pub const ADDRESS_SEED: &'static [u8; 7] = br"gateway";

/// Get program-derived gateway address for the authority
pub fn get_gateway_token_address_with_seed(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&authority.to_bytes(), ADDRESS_SEED], &id())
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::borsh as program_borsh;


}
