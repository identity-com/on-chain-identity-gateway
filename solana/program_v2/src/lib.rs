#![feature(const_trait_impl)]
#![feature(const_option)]
#![feature(const_option_ext)]
#![feature(const_mut_refs)]
#![feature(const_ptr_offset)]
#![feature(generic_associated_types)]

//! The gateway v2 program from Identity.com

// Solana is on 1.59 currently, this requires the now deprecated where clause position
#![cfg_attr(VERSION_GREATER_THAN_59, allow(deprecated_where_clause_location))]
#![cfg_attr(not(VERSION_GREATER_THAN_59), feature(const_fn_trait_bound))]
#![cfg_attr(all(doc, CHANNEL_NIGHTLY), feature(doc_auto_cfg))]
#![warn(
    unused_import_braces,
    unused_imports,
    missing_docs,
    missing_debug_implementations,
    clippy::pedantic
)]
#![allow(
    clippy::cast_possible_truncation,
    clippy::module_name_repetitions,
    clippy::missing_errors_doc,
    clippy::too_many_lines,
    clippy::mut_mut,
    clippy::wildcard_imports
)]

extern crate core;
pub mod in_place;
pub mod instructions;
pub mod payment_accounts;
pub mod util;

use crate::util::OptionalNonSystemPubkey;
use bitflags::bitflags;
use cruiser::account_list::AccountList;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::in_place::InPlace;
use cruiser::instruction_list::InstructionList;
use cruiser::on_chain_size::{OnChainSize, OnChainSizeWithArg};
use cruiser::pda_seeds::{PDASeed, PDASeeder};
use cruiser::{
    entrypoint_list, CruiserResult, GenericError, Pubkey, ToSolanaAccountInfo, UnixTimestamp,
};
use std::num::NonZeroU8;

entrypoint_list!(GatewayInstructions, GatewayInstructions);

/// Instructions for the gateway v2 program
#[derive(InstructionList, Copy, Clone, Debug)]
#[instruction_list(account_list = GatewayAccountList, account_info = [<'a, AI> AI where AI: ToSolanaAccountInfo<'a>])]
pub enum GatewayInstructions {
    /// Creates a new network.
    #[instruction(instruction_type = instructions::CreateNetwork)]
    CreateNetwork,
    /// Updates a network.
    #[instruction(instruction_type = instructions::UpdateNetwork)]
    UpdateNetwork,
    /// Closes a network.
    /// TODO: Do we need this?
    #[instruction(instruction_type = instructions::CloseNetwork)]
    CloseNetwork,
    /// Creates a new gatekeeper
    #[instruction(instruction_type = instructions::CreateGatekeeper)]
    CreateGatekeeper,
    /// Updates a gatekeeper's data.
    #[instruction(instruction_type = instructions::UpdateGatekeeper)]
    UpdateGatekeeper,
    //TODO: Do we need a close gatekeeper instruction?
    /// Sets the state of a gatekeeper
    #[instruction(instruction_type = instructions::SetGatekeeperState)]
    SetGatekeeperState,
    /// Issues a pass from a gatekeeper
    #[instruction(instruction_type = instructions::IssuePass)]
    IssuePass,
    /// Refreshes a pass from a gatekeeper
    #[instruction(instruction_type = instructions::RefreshPass)]
    RefreshPass,
}

/// Accounts for the gateway v2 program
#[allow(clippy::large_enum_variant)]
#[derive(AccountList, Debug)]
#[account_list(discriminant_type = NonZeroU8)]
pub enum GatewayAccountList {
    /// A network which manages many [`Gatekeepers`].
    GatekeeperNetwork(GatekeeperNetwork),
    /// A gatekeeper who can issue [`Pass`]es and is manged by a [`GatekeeperNetwork`].
    Gatekeeper(Gatekeeper),
    /// A pass issued by a [`Gatekeeper`] to a user.
    Pass(Pass),
}

bitflags! {
    /// The flags for a key on a network
    #[derive(BorshDeserialize, BorshSerialize)]
    pub struct NetworkKeyFlags: u16{
        /// Key can change keys
        const AUTH = 1 << 0;
        /// Key can set [`GatekeeperNetwork::network_features`] (User expiry, did issuance, etc.)
        const SET_FEATURES = 1 << 1;
        /// Key can create new gatekeepers
        const CREATE_GATEKEEPER = 1 << 2;
        /// Key can freeze gatekeepers
        const FREEZE_GATEKEEPER = 1 << 3;
        /// Key can unfreeze gatekeepers
        const UNFREEZE_GATEKEEPER = 1 << 4;
        /// Key can halt gatekeepers
        const HALT_GATEKEEPER = 1 << 5;
        /// Key can un-halt gatekeepers
        const UNHALT_GATEKEEPER = 1 << 6;
        /// Key can un-revoke passes with gatekeepers
        const UNREVOKE_PASS = 1 << 7;
        /// Key can adjust fees in [`GatekeeperNetwork::fees`]
        const ADJUST_FEES = 1 << 8;
        /// Key can add new fee types to [`GatekeeperNetwork::fees`]
        const ADD_FEES = 1 << 9;
        /// Key can remove fee types from [`GatekeeperNetwork::fees`]
        const REMOVE_FEES = 1 << 10;
        /// Key can access the network's vault
        const ACCESS_VAULT = 1 << 11;
        /// Key can set [`GatekeeperNetwork::pass_expire_time`]
        const SET_EXPIRE_TIME = 1 << 12;
    }
    /// The flags for a key on a gatekeeper
    #[derive(BorshDeserialize, BorshSerialize)]
    pub struct GatekeeperKeyFlags: u16{
        /// Key can change keys
        const AUTH = 1 << 0;
        /// Key can issue passes
        const ISSUE = 1 << 1;
        /// Key can refresh passes
        const REFRESH = 1 << 2;
        /// Key can freeze passes
        const FREEZE = 1 << 3;
        /// Key can unfreeze passes
        const UNFREEZE = 1 << 4;
        /// Key can revoke passes
        const REVOKE = 1 << 5;
        /// Key can adjust gatekeeper fees
        const ADJUST_FEES = 1 << 6;
        /// Key can set gatekeeper addresses key
        const SET_ADDRESSES = 1 << 7;
        /// Key can set data on passes
        const SET_PASS_DATA = 1 << 8;
        /// Key can add new fee types to a gatekeeper
        const ADD_FEES = 1 << 9;
        /// Key can remove fee types from a gatekeeper
        const REMOVE_FEES = 1 << 10;
        /// Key can access the gatekeeper's vault
        const ACCESS_VAULT = 1 << 11;
        /// Key can unrevoke a pass with network concurrence.
        const UNREVOKE_PASS = 1 << 12;
    }
}
impl const OnChainSize for NetworkKeyFlags {
    const ON_CHAIN_SIZE: usize = u16::ON_CHAIN_SIZE;
}
impl const OnChainSize for GatekeeperKeyFlags {
    const ON_CHAIN_SIZE: usize = u16::ON_CHAIN_SIZE;
}

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, InPlace)]
pub struct NetworkFees {
    /// The token for the fee, `None` means fee is invalid
    pub token: OptionalNonSystemPubkey,
    /// Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).
    pub issue: u16,
    /// Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).
    pub refresh: u16,
    /// Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).
    pub expire: u16,
    /// Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).
    pub verify: u16,
}
impl const OnChainSize for NetworkFees {
    const ON_CHAIN_SIZE: usize = OptionalNonSystemPubkey::ON_CHAIN_SIZE + u16::ON_CHAIN_SIZE * 4;
}

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[derive(Debug, InPlace)]
pub struct GatekeeperNetwork {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    pub network_features: [[u8; 32]; 128],
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: UnixTimestamp,
    /// Changing this justifies a new network as all old passes will become invalid
    pub network_data_len: u16,
    /// The bump for the signer
    pub signer_bump: u8,
    /// Number of different token fees
    pub fees_count: u16,
    /// Number of auth keys
    pub auth_keys_count: u16,
    /// The fees for this network
    pub fees: [NetworkFees; 128],
    /// Keys with permissions on the network
    pub auth_keys: [NetworkAuthKey; 128],
}

/// The authority key for a [`GatekeeperNetwork`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, InPlace)]
pub struct NetworkAuthKey {
    /// The permissions this key has
    pub flags: NetworkKeyFlags,
    /// The key
    pub key: Pubkey,
}
impl OnChainSize for NetworkAuthKey {
    const ON_CHAIN_SIZE: usize = NetworkKeyFlags::ON_CHAIN_SIZE + Pubkey::ON_CHAIN_SIZE;
}

/// Seeder for the network signer
#[derive(Debug)]
pub struct NetworkSignerSeeder {
    /// The network the signer is for
    pub network: Pubkey,
}
impl PDASeeder for NetworkSignerSeeder {
    fn seeds<'a>(&'a self) -> Box<dyn Iterator<Item = &'a dyn PDASeed> + 'a> {
        Box::new([&"network" as &dyn PDASeed, &self.network].into_iter())
    }
}

/// The state of a [`Gatekeeper`]
#[derive(Debug, Copy, Clone, Eq, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum GatekeeperState {
    /// Functional gatekeeper
    Active,
    /// Gatekeeper may not issue passes
    Frozen,
    /// Gatekeeper may not issue passes and all passes invalid
    Halted,
}
impl const OnChainSize for GatekeeperState {
    const ON_CHAIN_SIZE: usize = 1;
}

/// The fees a gatekeeper/network can take
#[derive(Debug, Clone, Eq, PartialEq, BorshSerialize, BorshDeserialize, InPlace)]
pub struct GatekeeperFees {
    /// The token for these fees. None value for this means native SOL price
    pub token: OptionalNonSystemPubkey,
    /// Fees taken at issuance of a new pass in token units or lamports for SOL.
    pub issue: u64,
    /// Fees taken when a pass is refreshed in token units or lamports for SOL.
    pub refresh: u64,
    /// The fee taken when a pass is expired in token units or lamports for SOL.
    /// This should only be used where pass value comes from one-time use.
    pub expire: u64,
    /// The fee taken when a pass is verified in token units or lamports for SOL.
    /// This should only be used where pass value comes from proper use
    pub verify: u64,
}
impl const OnChainSize for GatekeeperFees {
    const ON_CHAIN_SIZE: usize = OptionalNonSystemPubkey::ON_CHAIN_SIZE + u64::ON_CHAIN_SIZE * 4;
}

/// A gatekeeper on a [`GatekeeperNetwork`] that can issue passes
#[derive(Debug, InPlace)]
pub struct Gatekeeper {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The number of keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Pubkey,
    /// A pointer to the addresses this gatekeeper uses for discoverability
    pub addresses: Pubkey,
    /// The staking account of this gatekeeper
    pub staking_account: Pubkey,
    /// The state of this gatekeeper
    pub gatekeeper_state: GatekeeperState,
    /// The bump for the signer of this gatekeeper
    pub signer_bump: u8,
    /// The fees for this gatekeeper
    pub fees: [GatekeeperFees; 128],
    /// The keys with permissions on this gatekeeper
    pub auth_keys: [GatekeeperAuthKey; 128],
}

/// The authority key for a [`Gatekeeper`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, InPlace)]
pub struct GatekeeperAuthKey {
    /// The permissions this key has
    pub flags: GatekeeperKeyFlags,
    /// The key
    pub key: Pubkey,
}
impl OnChainSize for GatekeeperAuthKey {
    const ON_CHAIN_SIZE: usize = GatekeeperKeyFlags::ON_CHAIN_SIZE + Pubkey::ON_CHAIN_SIZE;
}

/// Seeder for the gatekeeper signer
#[derive(Debug)]
pub struct GatekeeperSignerSeeder {
    /// The gatekeeper the signer is for
    pub gatekeeper: Pubkey,
}
impl PDASeeder for GatekeeperSignerSeeder {
    fn seeds<'a>(&'a self) -> Box<dyn Iterator<Item = &'a dyn PDASeed> + 'a> {
        Box::new([&"gatekeeper" as &dyn PDASeed, &self.gatekeeper].into_iter())
    }
}

/// The state of a [`Pass`].
#[derive(Debug, Copy, Clone, Eq, PartialEq, BorshSerialize, BorshDeserialize)]
pub enum PassState {
    /// Functional pass
    Active,
    /// Pass invalid, can be reactivated
    Frozen,
    /// Pass invalid, cannot be reactivated without network approval
    Revoked,
}
impl const OnChainSize for PassState {
    const ON_CHAIN_SIZE: usize = 1;
}
/// Mutable access to a pass state
#[derive(Debug)]
pub struct PassStateMut<'a>(&'a mut u8);
impl<'a> PassStateMut<'a> {
    /// Gets the current state
    #[allow(clippy::missing_panics_doc)]
    #[must_use]
    pub const fn get(&self) -> PassState {
        match self.0 {
            0 => PassState::Active,
            1 => PassState::Frozen,
            2 => PassState::Revoked,
            _ => panic!("Invalid pass state"),
        }
    }

    /// Sets the state
    pub const fn set(&mut self, state: PassState) {
        *self.0 = match state {
            PassState::Active => 0,
            PassState::Frozen => 1,
            PassState::Revoked => 2,
        }
    }
}

/// A pass that can be issued by a [`Gatekeeper`]
#[derive(Debug)]
pub struct Pass {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The issue time of this pass, used for expiry
    pub issue_time: UnixTimestamp,
    /// The network this pass belongs to
    pub network: Pubkey,
    /// The gatekeeper that issued this pass
    pub issuing_gatekeeper: Pubkey,
    /// The wallet this pass belongs to
    pub owner_wallet: Pubkey,
    /// The state of this pass
    pub state: PassState,
    /// Additional data from the network
    pub network_data: Vec<u8>,
    /// Additional data from the gatekeeper
    pub gatekeeper_data: Vec<u8>,
}
/// Size of a pass
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct PassSize {
    /// The length of network data on a pass
    pub network_data_len: u16,
    /// The length of gatekeeper data on a pass
    pub gatekeeper_data_len: u16,
}
impl const OnChainSizeWithArg<PassSize> for Pass {
    fn on_chain_size_with_arg(arg: PassSize) -> usize {
        u8::ON_CHAIN_SIZE
            + UnixTimestamp::ON_CHAIN_SIZE
            + Pubkey::ON_CHAIN_SIZE * 3
            + PassState::ON_CHAIN_SIZE
            + arg.network_data_len as usize
            + arg.gatekeeper_data_len as usize
            + arg.gatekeeper_data_len as usize
    }
}

/// In-place access to the [`Pass`] data
#[derive(Debug)]
pub struct PassAccess<'a> {
    data: &'a mut [u8],
    network_data_len: u16,
}
impl<'a> PassAccess<'a> {
    const VERSION_OFFSET: usize = 0;
    const ISSUE_TIME_OFFSET: usize = Self::VERSION_OFFSET + 1;
    const NETWORK_OFFSET: usize = Self::ISSUE_TIME_OFFSET + 8;
    const ISSUING_GATEKEEPER_OFFSET: usize = Self::NETWORK_OFFSET + 32;
    const OWNER_WALLET_OFFSET: usize = Self::ISSUING_GATEKEEPER_OFFSET + 32;
    const STATE_OFFSET: usize = Self::OWNER_WALLET_OFFSET + 32;
    const DYNAMIC_DATA_OFFSET: usize = Self::STATE_OFFSET + 1;

    /// Creates a new [`PassAccess`]
    pub fn new(data: &'a mut [u8], network_data_len: u16) -> CruiserResult<Self> {
        let needed_data = Pass::on_chain_size_with_arg(PassSize {
            network_data_len,
            gatekeeper_data_len: 0,
        });
        let data_len = data.len();
        if data_len < needed_data {
            Err(GenericError::Custom {
                error: format!(
                    "Not enough pass data, needed {}, got {}",
                    needed_data, data_len
                ),
            }
            .into())
        } else {
            Ok(Self {
                data,
                network_data_len,
            })
        }
    }

    /// Accesses [`Pass::version`]
    #[must_use]
    pub const fn version(&self) -> u8 {
        self.data[Self::VERSION_OFFSET]
    }

    /// Accesses [`Pass::version`] mutably
    #[must_use]
    pub const fn version_mut(&mut self) -> &mut u8 {
        &mut self.data[Self::VERSION_OFFSET]
    }

    /// Accesses [`Pass::issue_time`]
    #[must_use]
    pub const fn issue_time(&self) -> &UnixTimestamp {
        // This has alignment issues, will need to fix that
        #[allow(clippy::cast_ptr_alignment)]
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::ISSUE_TIME_OFFSET)
                .cast::<UnixTimestamp>()
        }
    }

    /// Accesses [`Pass::issue_time`] mutably
    #[must_use]
    pub const fn issue_time_mut(&mut self) -> &mut UnixTimestamp {
        // This has alignment issues, will need to fix that
        #[allow(clippy::cast_ptr_alignment)]
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::ISSUE_TIME_OFFSET)
                .cast::<UnixTimestamp>()
        }
    }

    /// Accesses [`Pass::network`]
    #[must_use]
    pub const fn network(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::NETWORK_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::network`] mutably
    #[must_use]
    pub const fn network_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::NETWORK_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::issuing_gatekeeper`]
    #[must_use]
    pub const fn issuing_gatekeeper(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::ISSUING_GATEKEEPER_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::issuing_gatekeeper`] mutably
    #[must_use]
    pub const fn issuing_gatekeeper_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::ISSUING_GATEKEEPER_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::owner_wallet`]
    #[must_use]
    pub const fn owner_wallet(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::OWNER_WALLET_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::owner_wallet`] mutably
    #[must_use]
    pub const fn owner_wallet_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::OWNER_WALLET_OFFSET)
                .cast::<Pubkey>()
        }
    }

    /// Accesses [`Pass::state`]
    #[must_use]
    pub const fn state(&self) -> PassState {
        match self.data[Self::STATE_OFFSET] {
            0 => PassState::Active,
            1 => PassState::Frozen,
            2 => PassState::Revoked,
            _ => unreachable!(),
        }
    }

    /// Accesses [`Pass::state`] mutably
    #[must_use]
    pub const fn state_mut(&mut self) -> PassStateMut {
        PassStateMut(&mut self.data[Self::STATE_OFFSET])
    }

    /// Accesses [`Pass::network_data`]
    #[must_use]
    pub fn network_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    /// Accesses [`Pass::network_data`] mutably
    #[must_use]
    pub fn network_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    /// Accesses [`Pass::gatekeeper_data`]
    #[must_use]
    pub fn gatekeeper_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }

    /// Accesses [`Pass::gatekeeper_data`] mutably
    #[must_use]
    pub fn gatekeeper_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }
}
