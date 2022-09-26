use std::fmt::{Display, Formatter};
use anchor_lang::prelude::*;
use crate::util::{OC_SIZE_DISCRIMINATOR, OC_SIZE_PUBKEY, OC_SIZE_U64, OC_SIZE_U8};

#[derive(Debug)]
#[account]
pub struct Pass {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The initial authority
    pub subject: Pubkey,
    /// The network this pass belongs to
    pub network: Pubkey,
    /// The pass number
    pub pass_number: u8,
    /// The bump for the signer
    pub signer_bump: u8,
    /// The gatekeeper that issued this pass
    pub gatekeeper: Pubkey,
    /// The issue time of this pass, used for expiry
    pub issue_time: i64,
    /// The state of this pass
    pub state: PassState,
    /// Additional data from the network
    pub network_data: [u8; 32],
    /// Additional data from the gatekeeper
    pub gatekeeper_data: [u8; 32],
}

impl Pass {
    pub fn is_valid_gatekeeper_state_change(&self, new_state: &PassState) -> bool {
        return true;

        // FROM V1.. TODO
        // // Only the issuing gatekeeper can freeze or unfreeze a GT
        // // Any gatekeeper in the network (checked above) can revoke
        // if (state == GatewayTokenState::Frozen || state == GatewayTokenState::Active)
        //     && gateway_token.issuing_gatekeeper != *gatekeeper_authority_info.key
        // {
        //     msg!("Error: Only the issuing gatekeeper can freeze or unfreeze");
        //     return Err(GatewayError::IncorrectGatekeeper.into());
        // }
    }
    pub fn is_valid_state_change(&self, new_state: &PassState) -> bool {
        match new_state {
            PassState::Active => match self.state {
                PassState::Active => false,
                PassState::Frozen => true,
                PassState::Revoked => false,
            },
            PassState::Frozen => match self.state {
                PassState::Active => true,
                PassState::Frozen => false,
                PassState::Revoked => false,
            },
            PassState::Revoked => match self.state {
                PassState::Active => true,
                PassState::Frozen => true,
                PassState::Revoked => false,
            },
        }
    }

    pub fn size(_network_data_length: i16, _gatekeeper_data: i16) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8 // version
            + OC_SIZE_PUBKEY // subject
            + OC_SIZE_PUBKEY // network
            + OC_SIZE_U8 // pass_number
            + OC_SIZE_U8 // signer_bump
            + OC_SIZE_PUBKEY // gatekeeper
            + OC_SIZE_U64 // issue_time
            + PassState::ON_CHAIN_SIZE // pass_state
            + OC_SIZE_U8 * 32 // network_data
            + OC_SIZE_U8 * 32 // gatekeeper_data
    }
}

/// The state of a [`Pass`].
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub enum PassState {
    /// Functional pass
    Active,
    /// Pass invalid, can be reactivated
    Frozen,
    /// Pass invalid, cannot be reactivated without network approval
    Revoked,
}

impl PassState {
    const ON_CHAIN_SIZE: usize = 1;
}

impl Display for PassState {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            PassState::Active => write!(f, "Active"),
            PassState::Frozen => write!(f, "Frozen"),
            PassState::Revoked => write!(f, "Revoked")
        }
    }
}