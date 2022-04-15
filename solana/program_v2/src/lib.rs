#![allow(stable_features)]
#![feature(const_trait_impl)]
#![feature(const_fn_trait_bound)]
#![feature(const_option)]
#![feature(const_option_ext)]
#![feature(const_mut_refs)]
#![feature(const_ptr_offset)]
#![feature(const_slice_index)]

//! The gateway v2 program from Identity.com

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
    clippy::mut_mut
)]

extern crate core;
pub mod in_place;
pub mod util;

use crate::util::OptionalNonSystemPubkey;
use bitflags::bitflags;
use cruiser::account_list::AccountList;
use cruiser::instruction_list::InstructionList;
use cruiser::on_chain_size::{OnChainSize, OnChainStaticSize};
use cruiser::{AccountInfo, CruiserResult, GenericError, Pubkey, UnixTimestamp};

/// Instructions for the gateway v2 program
#[derive(InstructionList, Copy, Clone, Debug)]
#[instruction_list(account_list = GatewayAccountList, account_info = [<AI> AI where AI: AccountInfo])]
pub enum GatewayInstructions {}

/// Accounts for the gateway v2 program
#[allow(clippy::large_enum_variant)]
#[derive(AccountList, Debug)]
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
    pub struct NetworkKeyFlags: u16{
        /// Key can change keys
        const AUTH = 1 << 0;
        /// Key can set network features (User expiry, did issuance, etc.)
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
        /// Key can adjust fees
        const ADJUST_FEES = 1 << 8;
    }
    /// The flags for a key on a gatekeeper
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
    }
}
impl const OnChainSize<()> for NetworkKeyFlags {
    fn on_chain_max_size(_arg: ()) -> usize {
        u16::on_chain_static_size()
    }
}
impl const OnChainSize<()> for GatekeeperKeyFlags {
    fn on_chain_max_size(_arg: ()) -> usize {
        u16::on_chain_static_size()
    }
}

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(Clone, Debug)]
pub struct NetworkFees {
    /// The token for the fee
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
impl const OnChainSize<()> for NetworkFees {
    fn on_chain_max_size(_arg: ()) -> usize {
        OptionalNonSystemPubkey::on_chain_static_size() + u16::on_chain_static_size() * 4
    }
}

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[derive(Debug)]
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
    pub fees: Vec<GatekeeperFees>,
    /// Keys with permissions on the network
    pub auth_keys: Vec<(NetworkKeyFlags, Pubkey)>,
}

/// The state of a [`Gatekeeper`]
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum GatekeeperState {
    /// Functional gatekeeper
    Active,
    /// Gatekeeper may not issue passes
    Frozen,
    /// Gatekeeper may not issue passes and all passes invalid
    Halted,
}
impl const OnChainSize<()> for GatekeeperState {
    fn on_chain_max_size(_arg: ()) -> usize {
        1
    }
}

/// The fees a gatekeeper/network can take
#[derive(Debug, Clone, Eq, PartialEq)]
pub struct GatekeeperFees {
    /// The token for these fees. None value for this means native SOL price
    pub token: OptionalNonSystemPubkey,
    /// Fees taken at issuance of a new pass
    pub issue: u64,
    /// Fees taken when a pass is refreshed
    pub refresh: u64,
    /// The fee taken when a pass is expired.
    /// This should only be used where pass value comes from one-time use.
    pub expire: u64,
    /// The fee taken when a pass is verified.
    /// This should only be used where pass value comes from proper use
    pub verify: u64,
}
impl const OnChainSize<()> for GatekeeperFees {
    fn on_chain_max_size(_arg: ()) -> usize {
        OptionalNonSystemPubkey::on_chain_static_size() + u64::on_chain_static_size() * 4
    }
}

/// A gatekeeper on a [`GatekeeperNetwork`] that can issue passes
#[derive(Debug)]
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
    pub fees: Vec<(OptionalNonSystemPubkey, GatekeeperFees)>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<(GatekeeperKeyFlags, Pubkey)>,
}

/// The state of a [`Pass`].
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum PassState {
    /// Functional pass
    Active,
    /// Pass invalid, can be reactivated
    Frozen,
    /// Pass invalid, cannot be reactivated without network approval
    Revoked,
}
impl const OnChainSize<()> for PassState {
    fn on_chain_max_size(_arg: ()) -> usize {
        1
    }
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
impl const OnChainSize<PassSize> for Pass {
    fn on_chain_max_size(arg: PassSize) -> usize {
        u8::on_chain_static_size()
            + UnixTimestamp::on_chain_static_size()
            + Pubkey::on_chain_static_size() * 3
            + PassState::on_chain_static_size()
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
        let needed_data = Pass::on_chain_max_size(PassSize {
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
    pub const fn network_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    /// Accesses [`Pass::network_data`] mutably
    #[must_use]
    pub const fn network_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    /// Accesses [`Pass::gatekeeper_data`]
    #[must_use]
    pub const fn gatekeeper_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }

    /// Accesses [`Pass::gatekeeper_data`] mutably
    #[must_use]
    pub const fn gatekeeper_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }
}
