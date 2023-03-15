use crate::errors::PassErrors;
use anchor_lang::prelude::*;
use std::fmt::{Display, Formatter};

#[derive(Debug, InitSpace)]
#[account]
pub struct Pass {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The initial authority
    pub subject: Pubkey,
    /// The network this pass belongs to
    pub network: Pubkey,
    /// The pass number
    pub pass_number: u16,
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

    pub fn refresh(&mut self) -> Result<()> {
        require!(self.state == PassState::Active, PassErrors::PassNotActive);

        self.issue_time = Clock::get().unwrap().unix_timestamp;

        Ok(())
    }

    pub fn expire(&mut self) -> Result<()> {
        require!(
            self.is_valid_state() && !self.has_expired(),
            PassErrors::InvalidPass
        );

        self.issue_time = -1;

        Ok(())
    }

    pub fn verify(&mut self) -> Result<()> {
        require!(
            self.is_valid_state() && !self.has_expired(),
            PassErrors::InvalidPass
        );

        Ok(())
    }

    pub fn is_valid_state(&mut self) -> bool {
        self.state == PassState::Active
    }

    pub fn has_expired(&mut self) -> bool {
        self.issue_time < 0
    }
}

/// The state of a [`Pass`].
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorDeserialize, AnchorSerialize, InitSpace)]
pub enum PassState {
    /// Functional pass
    Active,
    /// Pass invalid, can be reactivated
    Frozen,
    /// Pass invalid, cannot be reactivated without network approval
    Revoked,
}

impl Display for PassState {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            PassState::Active => write!(f, "Active"),
            PassState::Frozen => write!(f, "Frozen"),
            PassState::Revoked => write!(f, "Revoked"),
        }
    }
}
