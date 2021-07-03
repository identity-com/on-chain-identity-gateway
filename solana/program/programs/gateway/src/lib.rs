//! SOL program

mod entrypoint;
pub mod error;
pub mod instruction_old;
pub mod processor;
pub mod state;

// Export current SDK types for downstream users building with a different SDK version
use anchor_lang::prelude::*;
pub use solana_program;

solana_program::declare_id!("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs");

use crate::solana_program::clock::UnixTimestamp;
use crate::state::{AddressSeed, Transitionable};

use bitflags::bitflags;
use borsh::{BorshDeserialize, BorshSerialize};

#[program]
#[warn(missing_docs)] // Doesn't actually work
mod gateway {
    // No use statements in this module except this one
    use super::*;
    use anchor_lang::Key;
    use std::ops::DerefMut;

    /// Add a new Gatekeeper to a network
    pub fn add_gatekeeper(ctx: Context<AddGatekeeper>) -> ProgramResult {
        msg!("GatewayInstruction::AddGatekeeper");

        ctx.accounts.gatekeeper_account.gatekeeper_authority =
            ctx.accounts.gatekeeper_authority.key();
        ctx.accounts.gatekeeper_account.gatekeeper_network = ctx.accounts.gatekeeper_network.key();

        Ok(())
    }

    /// Issue a new gateway token
    ///
    /// # Arguments
    /// * `seed` - An optional seed to use when generating a gateway token allowing multiple gateway tokens per wallet TODO: Replace with [`AddressSeed`]
    /// * `nonce` - the nonce (bump seed) generated for this address
    /// * `expire_time` - An optional unix timestamp at which point the issued token is no longer valid TODO: Replace with [`UnixTimeStamp`]
    pub fn issue_vanilla(
        ctx: Context<IssueVanilla>,
        seed: Option<[u8; 8]>,
        nonce: u8,
        expire_time: Option<i64>,
    ) -> ProgramResult {
        msg!("GatewayInstruction::IssueVanilla");

        *ctx.accounts.gateway_token.deref_mut() = GatewayToken::new_vanilla(
            nonce,
            seed,
            ctx.accounts.owner.key(),
            ctx.accounts.gatekeeper_network.key(),
            ctx.accounts.gatekeeper_authority.key(),
            expire_time,
        );

        Ok(())
    }

    /// Update the gateway token state
    /// Revoke, freeze or unfreeze
    ///
    /// # Arguments
    /// * `state` - The new state of the gateway token
    pub fn set_state(ctx: Context<SetState>, state: GatewayTokenState) -> ProgramResult {
        if !ctx.accounts.gateway_token.is_valid_state_change(&state) {
            msg!(
                "Error: invalid state change from {:?} to {:?}",
                ctx.accounts.gateway_token.state,
                state
            );
            return Err(GatewayError::InvalidStateChange.into());
        }

        if matches!(state, GatewayTokenState::Frozen | GatewayTokenState::Active)
            && ctx.accounts.gateway_token.issuing_gatekeeper
                != *ctx.accounts.gatekeeper_authority.key
        {
            msg!("Error: Only the issuing gatekeeper can freeze or unfreeze");
            return Err(GatewayError::IncorrectGatekeeper.into());
        }

        ctx.accounts.gateway_token.state = state;
        Ok(())
    }

    /// Update the gateway token expiry time
    ///
    /// # Arguments
    /// * `expire_time` - The new expiry time of the gateway token TODO: Replace with [`UnixTimeStamp`]
    pub fn update_expiry(ctx: Context<UpdateExpiry>, expire_time: i64) -> ProgramResult {
        ctx.accounts.gateway_token.set_expire_time(expire_time);
        Ok(())
    }
}

#[error]
pub enum GatewayError {
    #[msg("The gateway token could not be changed into the requested state")]
    InvalidStateChange,
    #[msg("The account is not owned by the gateway program")]
    IncorrectGatekeeper,
}

#[warn(missing_docs)]
#[derive(Accounts)]
/// Add a new Gatekeeper to a network
pub struct AddGatekeeper<'info> {
    /// The payer of the transaction
    #[account(mut, signer)]
    pub funder_account: AccountInfo<'info>,
    /// The destination account containing details of the gatekeeper
    ///
    /// # Associated
    /// associated = `gatekeeper_authority`
    #[account(
    init,
    associated = gatekeeper_authority,
    payer = funder_account,
    )]
    pub gatekeeper_account: ProgramAccount<'info, Gatekeeper>,
    /// The authority that owns the gatekeeper account
    pub gatekeeper_authority: AccountInfo<'info>,
    /// The gatekeeper network to which the gatekeeper belongs
    #[account(signer)]
    pub gatekeeper_network: AccountInfo<'info>,
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
    /// System program
    pub system_program: AccountInfo<'info>,
}

/// Issue a new gateway token
#[warn(missing_docs)]
#[derive(Accounts)]
#[instruction(seed: Option<[u8; 8]>, nonce: u8)]
pub struct IssueVanilla<'info> {
    /// The payer of the transaction
    #[account(mut, signer)]
    pub funder_account: AccountInfo<'info>,
    /// The destination account of the gateway token
    ///
    /// # Seeds
    /// 0. `owner.key`
    /// 1. `seed`, default to empty byte array
    /// 2. `nonce`
    #[account(
    init,
    seeds = [owner.key.as_ref(), seed.as_ref().map(|s|s as &[u8]).unwrap_or(&[]), &[nonce]],
    payer = funder_account,
    )]
    pub gateway_token: ProgramAccount<'info, GatewayToken>,
    /// The wallet that the gateway token is issued for
    pub owner: AccountInfo<'info>,
    /// The account containing details of the gatekeeper issuing the gateway token
    ///
    /// # Associated
    /// associated = `gatekeeper_authority`
    #[account(
    associated = gatekeeper_authority,
    belongs_to = gatekeeper_authority,
    belongs_to = gatekeeper_network,
    )]
    pub gatekeeper_account: ProgramAccount<'info, Gatekeeper>,
    /// The authority that owns the gatekeeper account
    #[account(signer)]
    pub gatekeeper_authority: AccountInfo<'info>,
    /// The gatekeeper network to which the gatekeeper belongs
    pub gatekeeper_network: AccountInfo<'info>, // Not technically needed, can be derived from `gatekeeper_account`
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
    /// System program
    pub system_program: AccountInfo<'info>,
}

/// Update the gateway token state
/// Revoke, freeze or unfreeze
#[warn(missing_docs)]
#[derive(Accounts)]
pub struct SetState<'info> {
    /// The destination account of the gateway token
    #[account(mut)]
    pub gateway_token: ProgramAccount<'info, GatewayToken>,
    /// The gatekeeper authority that is making the change
    #[account(signer)]
    pub gatekeeper_authority: AccountInfo<'info>,
    /// The account containing details of the gatekeeper
    #[account(
    belongs_to = gatekeeper_authority,
    constraint = gateway_token.gatekeeper_network == gatekeeper_account.gatekeeper_network,
    )]
    pub gatekeeper_account: ProgramAccount<'info, Gatekeeper>,
}

/// Update the gateway token expiry time
#[warn(missing_docs)]
#[derive(Accounts)]
pub struct UpdateExpiry<'info> {
    /// The destination account of the gateway token
    #[account(mut)]
    pub gateway_token: ProgramAccount<'info, GatewayToken>,
    /// The gatekeeper authority that is making the change
    #[account(signer)]
    pub gatekeeper_authority: AccountInfo<'info>,
    /// The account containing details of the gatekeeper
    #[account(
    belongs_to = gatekeeper_authority,
    constraint = gatekeeper_account.gatekeeper_network == gateway_token.gatekeeper_network,
    )]
    pub gatekeeper_account: ProgramAccount<'info, Gatekeeper>,
}

#[associated]
#[derive(Default)]
pub struct Gatekeeper {
    // pub nonce: u8,
    pub gatekeeper_authority: Pubkey,
    pub gatekeeper_network: Pubkey,
}

#[account]
#[derive(Default)]
pub struct GatewayToken {
    pub nonce: u8,
    // TODO: Replace with AddressSeed
    pub seed: Option<[u8; 8]>,
    pub features: u8,
    pub parent_token: Option<Pubkey>,
    pub owner_wallet: Pubkey,
    pub owner_identity: Option<Pubkey>,
    pub gatekeeper_network: Pubkey,
    pub issuing_gatekeeper: Pubkey,
    pub state: GatewayTokenState,
    // TODO: Replace with [`UnixTimeStamp`]
    pub expire_time: Option<i64>,
}
impl GatewayToken {
    pub fn new_vanilla(
        nonce: u8,
        seed: Option<AddressSeed>,
        owner_wallet: Pubkey,
        gatekeeper_network: Pubkey,
        issuing_gatekeeper: Pubkey,
        expire_time: Option<UnixTimestamp>,
    ) -> Self {
        Self {
            nonce,
            seed,
            features: if expire_time.is_some() {
                Features::EXPIREABLE.bits
            } else {
                Features::empty().bits
            },
            parent_token: None,
            owner_wallet,
            owner_identity: None,
            gatekeeper_network,
            issuing_gatekeeper,
            state: GatewayTokenState::default(),
            expire_time,
        }
    }

    pub fn set_expire_time(&mut self, expire_time: UnixTimestamp) {
        self.features &= Features::EXPIREABLE.bits;
        self.expire_time = Some(expire_time);
    }
}
impl Transitionable<GatewayTokenState> for GatewayToken {
    fn is_valid_state_change(&self, new_state: &GatewayTokenState) -> bool {
        #[allow(clippy::match_like_matches_macro)]
        match (self.state, new_state) {
            (GatewayTokenState::Active, GatewayTokenState::Frozen) => true,
            (GatewayTokenState::Frozen, GatewayTokenState::Active) => true,
            (GatewayTokenState::Active, GatewayTokenState::Revoked) => true,
            (GatewayTokenState::Frozen, GatewayTokenState::Revoked) => true,
            _ => false,
        }
        // // If more verbose is wanted
        // match (self.state, *new_state) {
        //     (GatewayTokenState::Active, GatewayTokenState::Active) => false,
        //     (GatewayTokenState::Active, GatewayTokenState::Frozen) => true,
        //     (GatewayTokenState::Active, GatewayTokenState::Revoked) => true,
        //     (GatewayTokenState::Frozen, GatewayTokenState::Active) => true,
        //     (GatewayTokenState::Frozen, GatewayTokenState::Frozen) => true,
        //     (GatewayTokenState::Frozen, GatewayTokenState::Revoked) => true,
        //     (GatewayTokenState::Revoked, _) => false,
        // }
    }
}

bitflags! {
    #[derive(BorshSerialize, BorshDeserialize)]
    #[repr(transparent)]
    pub struct Features: u8{
        const SESSION =             1 << 0;
        const EXPIREABLE =          1 << 1;
        const TRANSACTION_LINKED =  1 << 2;
        const IDENTITY_LINKED =     1 << 3;
        const CUSTOM1 =             1 << 4;
        const CUSTOM2 =             1 << 5;
        const CUSTOM3 =             1 << 6;
        const CUSTOM4 =             1 << 7;
    }
}
impl Default for Features {
    fn default() -> Self {
        Self::empty()
    }
}

#[derive(BorshSerialize, BorshDeserialize, Copy, Clone, Debug, Eq, PartialEq)]
pub enum GatewayTokenState {
    Active,
    Frozen,
    Revoked,
}
impl Default for GatewayTokenState {
    fn default() -> Self {
        Self::Active
    }
}
