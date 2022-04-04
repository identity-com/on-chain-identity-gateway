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
    clippy::too_many_lines
)]

use bitflags::bitflags;
use cruiser::account_list::AccountList;
use cruiser::instruction_list::InstructionList;
use cruiser::on_chain_size::{OnChainSize, OnChainStaticSize};
use cruiser::solana_program::program_memory::sol_memcmp;
use cruiser::{AccountInfo, CruiserResult, GenericError, Pubkey, UnixTimestamp};
use std::num::NonZeroU64;

#[derive(InstructionList, Copy, Clone, Debug)]
#[instruction_list(account_list = GatewayAccountList, account_info = [<AI> AI where AI: AccountInfo])]
pub enum GatewayInstructions {}

#[derive(AccountList, Debug)]
pub enum GatewayAccountList {
    GatekeeperNetwork(GatekeeperNetwork),
    Gatekeeper(Gatekeeper),
    Pass(Pass),
}

/// The fees a gatekeeper/network can take
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct Fees {
    /// Fees taken at issuance of a new pass
    pub issue: Fee,
    /// Fees taken when a pass is refreshed
    pub refresh: Fee,
    /// The fee taken when a pass is expired.
    /// This should only be used where pass value comes from one-time use.
    pub expire: Fee,
    /// The fee taken when a pass is verified.
    /// This should only be used where pass value comes from proper use
    pub verify: Fee,
}

/// A fee for the gatekeeper/network
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum Fee {
    /// Takes no fee
    None,
    /// Takes SOL as a fee
    SOL(NonZeroU64),
    /// Takes a token as a fee
    Token {
        /// The mint for the fee
        mint: Pubkey,
        /// The amount of the token in its decimals
        amount: NonZeroU64,
    },
}
impl OnChainSize<()> for Fee {
    fn on_chain_max_size(_arg: ()) -> usize {
        1 + [
            0,
            NonZeroU64::on_chain_static_size(),
            Pubkey::on_chain_static_size() + NonZeroU64::on_chain_static_size(),
        ]
        .into_iter()
        .max()
        .unwrap()
    }
}

bitflags! {
    pub struct NetworkKeyFlags: u8{}
    pub struct GatekeeperKeyFlags: u8{}
}

#[derive(Debug)]
pub struct GatekeeperNetwork {
    pub version: u8,
    pub network_features: [(); 128],
    pub auth_threshold: u8,
    pub network_fees: Fees,
    pub pass_expire_time: UnixTimestamp,
    /// Changing this justifies a new network as all old passes will become invalid
    pub network_data_len: u16,
    pub signer_bump: u8,
    pub valid_mints: Vec<OptionalNonSystemPubkey>,
    pub auth_keys: Vec<(NetworkKeyFlags, Pubkey)>,
}

#[derive(Debug)]
pub struct GatekeeperNetworkWalletSeeder {
    pub network: Pubkey,
    pub wallet_index: u16,
}

#[derive(Debug, Clone)]
pub struct OptionalNonSystemPubkey(Pubkey);
impl From<OptionalNonSystemPubkey> for Option<Pubkey> {
    fn from(from: OptionalNonSystemPubkey) -> Self {
        if sol_memcmp(from.0.as_ref(), &[0; 32], 32) == 0 {
            None
        } else {
            Some(from.0)
        }
    }
}
impl From<Pubkey> for OptionalNonSystemPubkey {
    fn from(from: Pubkey) -> Self {
        Self(from)
    }
}
impl OnChainSize<()> for OptionalNonSystemPubkey {
    fn on_chain_max_size(arg: ()) -> usize {
        Pubkey::on_chain_max_size(arg)
    }
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

#[derive(Debug)]
pub struct Gatekeeper {
    pub version: u8,
    pub fees: Fees,
    pub auth_threshold: u8,
    pub gatekeeper_network: Pubkey,
    pub addresses: Pubkey,
    pub staking_account: Pubkey,
    pub gatekeeper_state: GatekeeperState,
    pub signer_bump: u8,
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
impl OnChainSize<()> for PassState {
    fn on_chain_max_size(_arg: ()) -> usize {
        1
    }
}

#[derive(Debug)]
pub struct Pass {
    pub version: u8,
    pub issue_time: UnixTimestamp,
    pub network: Pubkey,
    pub issuing_gatekeeper: Pubkey,
    pub owner_wallet: Pubkey,
    pub state: PassState,
    pub network_data: Vec<u8>,
    pub gatekeeper_data: Vec<u8>,
}

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

    pub fn new(data: &'a mut [u8], network_data_len: u16) -> CruiserResult<Self> {
        let needed_data = Self::on_chain_size(network_data_len, 0);
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

    #[must_use]
    pub fn version(&self) -> u8 {
        self.data[Self::VERSION_OFFSET]
    }

    #[must_use]
    pub fn version_mut(&mut self) -> &mut u8 {
        &mut self.data[Self::VERSION_OFFSET]
    }

    #[must_use]
    pub fn issue_time(&self) -> &UnixTimestamp {
        // This has alignment issues, will need to fix that
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::ISSUE_TIME_OFFSET)
                .cast::<UnixTimestamp>()
        }
    }

    #[must_use]
    pub fn issue_time_mut(&mut self) -> &mut UnixTimestamp {
        // This has alignment issues, will need to fix that
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::ISSUE_TIME_OFFSET)
                .cast::<UnixTimestamp>()
        }
    }

    #[must_use]
    pub fn network(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::NETWORK_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn network_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::NETWORK_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn issuing_gatekeeper(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::ISSUING_GATEKEEPER_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn issuing_gatekeeper_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::ISSUING_GATEKEEPER_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn owner_wallet(&self) -> &Pubkey {
        unsafe {
            &*self
                .data
                .as_ptr()
                .add(Self::OWNER_WALLET_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn owner_wallet_mut(&mut self) -> &mut Pubkey {
        unsafe {
            &mut *self
                .data
                .as_mut_ptr()
                .add(Self::OWNER_WALLET_OFFSET)
                .cast::<Pubkey>()
        }
    }

    #[must_use]
    pub fn state(&self) -> PassState {
        match self.data[Self::STATE_OFFSET] {
            0 => PassState::Active,
            1 => PassState::Frozen,
            2 => PassState::Revoked,
            _ => unreachable!(),
        }
    }

    #[must_use]
    pub fn state_mut(&mut self) -> &mut PassState {
        todo!()
    }

    #[must_use]
    pub fn network_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    #[must_use]
    pub fn network_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET..][..self.network_data_len as usize]
    }

    #[must_use]
    pub fn gatekeeper_data(&self) -> &[u8] {
        &self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }

    #[must_use]
    pub fn gatekeeper_data_mut(&mut self) -> &mut [u8] {
        &mut self.data[Self::DYNAMIC_DATA_OFFSET + self.network_data_len as usize..]
    }

    #[must_use]
    fn on_chain_size(network_data_len: u16, gatekeeper_data_len: u16) -> usize {
        u8::on_chain_static_size()
            + UnixTimestamp::on_chain_static_size()
            + Pubkey::on_chain_static_size() * 3
            + PassState::on_chain_static_size()
            + network_data_len as usize
            + gatekeeper_data_len as usize
    }
}
