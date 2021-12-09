//! Program state
use solana_gateway::state::{GatewayToken, GatewayTokenState};

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
            GatewayTokenState::Active => match self.state {
                GatewayTokenState::Active => false,
                GatewayTokenState::Frozen => true,
                GatewayTokenState::Revoked => false,
            },
            GatewayTokenState::Frozen => match self.state {
                GatewayTokenState::Active => true,
                GatewayTokenState::Frozen => false,
                GatewayTokenState::Revoked => false,
            },
            GatewayTokenState::Revoked => match self.state {
                GatewayTokenState::Active => true,
                GatewayTokenState::Frozen => true,
                GatewayTokenState::Revoked => false,
            },
        }
    }
}
