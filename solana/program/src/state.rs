//! Program state
use {
    crate::id,
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey
    }
};
use solana_gateway::state::{ GatewayTokenState, GatewayToken };

/// A Gatekeeper account
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Gatekeeper {
    /// The public key of the owner of the gatekeeper account  
    pub authority: Pubkey,

    /// The public key of the network to which this gatekeeper belongs  
    pub network: Pubkey,
}

/// Defines an object that has a state, that can be transitioned
pub trait Transitionable<State> {
    /// Defines rules for transitioning an object
    fn is_valid_state_change(&self, new_state: &State) -> bool;
}
impl Transitionable<GatewayTokenState> for GatewayToken {
    /// defines the set of valid state transitions for gateway tokens.
    /// Active GTs can be frozen or revoked
    /// Frozen GTs can be unfrozen (active) or revoked
    /// Revoked GTs cannot be transitioned
    fn is_valid_state_change(&self, new_state: &GatewayTokenState) -> bool {
        match new_state {
            GatewayTokenState::Active => {
                match self.state {
                    GatewayTokenState::Active => false,
                    GatewayTokenState::Frozen => true,
                    GatewayTokenState::Revoked => false
                }
            }
            GatewayTokenState::Frozen => {
                match self.state {
                    GatewayTokenState::Active => true,
                    GatewayTokenState::Frozen => false,
                    GatewayTokenState::Revoked => false
                }
            }
            GatewayTokenState::Revoked => {
                match self.state {
                    GatewayTokenState::Active => true,
                    GatewayTokenState::Frozen => true,
                    GatewayTokenState::Revoked => false
                }
            }
        }
    }
}

/// The seed string used to derive a program address for a gateway token from an owner account
pub const GATEWAY_TOKEN_ADDRESS_SEED: & [u8; 7] = br"gateway";

/// The seed string used to derive a program address for a gateway token from an owner account
pub const GATEKEEPER_ADDRESS_SEED: & [u8; 10] = br"gatekeeper";

/// An optional seed to use when generating a gateway token,
/// allowing multiple gateway tokens per wallet
pub type AddressSeed = [u8;8];

/// Get program-derived gateway token address for the authority
pub fn get_gateway_token_address_with_seed(authority: &Pubkey, additional_seed: &Option<AddressSeed>) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&authority.to_bytes(), GATEWAY_TOKEN_ADDRESS_SEED, &additional_seed.unwrap_or_default()], 
        &id())
}

/// Get program-derived gatekeeper address for the authority
pub fn get_gatekeeper_address_with_seed(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[&authority.to_bytes(), GATEKEEPER_ADDRESS_SEED],
        &id())
}
