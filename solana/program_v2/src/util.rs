//! Utility functions and types.

use crate::{
    Gatekeeper, GatekeeperFees, GatekeeperNetwork, GatewayAccountList, NetworkFees,
    NetworkKeyFlags, Pass,
};
use cruiser::account_argument::{
    AccountArgument, AccountInfoIterator, FromAccounts, ValidateArgument,
};
use cruiser::account_types::in_place_account::InPlaceAccount;
use cruiser::account_types::system_program::SystemProgram;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::in_place::GetNum;
use cruiser::in_place::{get_properties, InPlace};
use cruiser::on_chain_size::{OnChainSize, OnChainSizeWithArg};
use cruiser::program::ProgramKey;
use cruiser::solana_program::program_memory::sol_memcmp;
use cruiser::spl::token::{TokenAccount, TokenProgram};
use cruiser::util::{MappableRef, TryMappableRef};
use cruiser::{AccountInfo, CruiserResult, Pubkey, UnixTimestamp};
use std::iter::once;
use std::num::NonZeroUsize;
use std::ops::Deref;

/// A [`Gatekeeper`] account
pub type GatekeeperAccount<AI> = InPlaceAccount<AI, GatewayAccountList, Gatekeeper>;
/// A [`Pass`] account
pub type PassAccount<AI> = InPlaceAccount<AI, GatewayAccountList, Pass>;

/// A Possible operation on a pass
#[derive(Debug, Copy, Clone, PartialEq, Eq, BorshDeserialize, BorshSerialize)]
pub enum Operation {
    /// Issue a new pass
    Issue,
    /// Refresh an existing pass
    Refresh,
    /// Expire a pass
    Expire,
    /// Verify a pass
    Verify,
}
impl Operation {
    /// TODO: make this return a `Option<&Pubkey>` somehow
    pub(crate) fn get_gatekeeper_fee<'a, 'b, A>(
        self,
        fees: &'a <GatekeeperFees as InPlace>::Access<'b, A>,
    ) -> CruiserResult<(Option<Pubkey>, u64)>
    where
        A: 'b + MappableRef + TryMappableRef + Deref<Target = [u8]>,
    {
        let out = match self {
            Operation::Issue => get_properties!(fees, GatekeeperFees { token, issue })?,
            Operation::Refresh => get_properties!(fees, GatekeeperFees { token, refresh })?,
            Operation::Expire => get_properties!(fees, GatekeeperFees { token, expire })?,
            Operation::Verify => get_properties!(fees, GatekeeperFees { token, verify })?,
        };
        Ok((out.0.get().copied(), out.1.get_num()))
    }

    /// TODO: make this return a `Option<&Pubkey>` somehow
    pub(crate) fn get_network_fee<'a, 'b, A>(
        self,
        fees: &'a <NetworkFees as InPlace>::Access<'b, A>,
    ) -> CruiserResult<(Option<Pubkey>, u16)>
    where
        A: 'b + MappableRef + TryMappableRef + Deref<Target = [u8]>,
    {
        let out = match self {
            Operation::Issue => get_properties!(fees, NetworkFees { token, issue })?,
            Operation::Refresh => get_properties!(fees, NetworkFees { token, refresh })?,
            Operation::Expire => get_properties!(fees, NetworkFees { token, expire })?,
            Operation::Verify => get_properties!(fees, NetworkFees { token, verify })?,
        };
        Ok((out.0.get().copied(), out.1.get_num()))
    }
}

/// A normal sol wallet or a token account
#[derive(Debug)]
pub enum TokenAccountOrWallet<AI> {
    /// A token wallet
    TokenAccount(TokenAccount<AI>),
    /// A normal sol wallet (not owned by token program)
    Wallet(AI),
}
impl<AI> AccountArgument for TokenAccountOrWallet<AI>
where
    AI: AccountInfo,
{
    type AccountInfo = AI;

    fn write_back(self, program_id: &Pubkey) -> CruiserResult<()> {
        match self {
            TokenAccountOrWallet::TokenAccount(token_account) => {
                token_account.write_back(program_id)
            }
            TokenAccountOrWallet::Wallet(wallet) => wallet.write_back(program_id),
        }
    }

    fn add_keys(&self, add: impl FnMut(Pubkey) -> CruiserResult<()>) -> CruiserResult<()> {
        match self {
            TokenAccountOrWallet::TokenAccount(token_account) => token_account.add_keys(add),
            TokenAccountOrWallet::Wallet(wallet) => wallet.add_keys(add),
        }
    }
}
impl<AI> FromAccounts for TokenAccountOrWallet<AI>
where
    AI: AccountInfo,
{
    fn from_accounts(
        program_id: &Pubkey,
        infos: &mut impl AccountInfoIterator<Item = Self::AccountInfo>,
        arg: (),
    ) -> CruiserResult<Self> {
        let info = AI::from_accounts(program_id, infos, arg)?;
        if *info.owner() == TokenProgram::<()>::KEY {
            Ok(Self::TokenAccount(TokenAccount::from_accounts(
                program_id,
                &mut once(info),
                arg,
            )?))
        } else {
            Ok(Self::Wallet(info))
        }
    }

    fn accounts_usage_hint(_arg: &()) -> (usize, Option<usize>) {
        (1, Some(1))
    }
}
impl<AI> ValidateArgument for TokenAccountOrWallet<AI>
where
    AI: AccountInfo,
{
    fn validate(&mut self, program_id: &Pubkey, arg: ()) -> CruiserResult<()> {
        match self {
            TokenAccountOrWallet::TokenAccount(token_account) => {
                token_account.validate(program_id, arg)
            }
            TokenAccountOrWallet::Wallet(wallet) => wallet.validate(program_id, arg),
        }
    }
}

/// A public key that uses the system program as the [`None`] value
#[derive(Debug, Clone, PartialEq, Eq, BorshSerialize, BorshDeserialize)]
pub struct OptionalNonSystemPubkey(pub(crate) Pubkey);
impl OptionalNonSystemPubkey {
    /// Turns this into an optional pubkey
    #[must_use]
    pub const fn into_option(self) -> Option<Pubkey> {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(self.0)
        }
    }
}
impl From<OptionalNonSystemPubkey> for Option<Pubkey> {
    fn from(from: OptionalNonSystemPubkey) -> Self {
        if sol_memcmp(from.0.as_ref(), &[0; 32], 32) == 0 {
            None
        } else {
            Some(from.0)
        }
    }
}
impl const From<Pubkey> for OptionalNonSystemPubkey {
    fn from(from: Pubkey) -> Self {
        Self(from)
    }
}
impl const OnChainSize for OptionalNonSystemPubkey {
    const ON_CHAIN_SIZE: usize = Pubkey::ON_CHAIN_SIZE;
}

/// Size for [`GatekeeperNetwork`]
#[derive(Debug, Copy, Clone)]
pub struct GatekeeperNetworkSize {
    /// The number of fee tokens
    pub fees_count: u16,
    /// The number of auth keys
    pub auth_keys: u16,
}
impl const OnChainSizeWithArg<GatekeeperNetworkSize> for GatekeeperNetwork {
    fn on_chain_size_with_arg(arg: GatekeeperNetworkSize) -> usize {
        let auth_key_size = <(NetworkKeyFlags, Pubkey)>::ON_CHAIN_SIZE;
        let auth_keys_slot_size = auth_key_size;
        let fee_size = GatekeeperFees::ON_CHAIN_SIZE;
        let fees_slot_size = max(fee_size, auth_keys_slot_size);

        u8::ON_CHAIN_SIZE
            + <[u8; 33]>::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + u8::ON_CHAIN_SIZE
            + UnixTimestamp::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + u8::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + round_to_next(
                arg.fees_count as usize * fee_size,
                NonZeroUsize::new(fees_slot_size).unwrap_or(NonZeroUsize::new(1).unwrap()),
            )
            + round_to_next(
                arg.auth_keys as usize * auth_key_size,
                NonZeroUsize::new(auth_keys_slot_size).unwrap_or(NonZeroUsize::new(1).unwrap()),
            )
    }
}

pub(crate) const fn max(a: usize, b: usize) -> usize {
    if a > b {
        a
    } else {
        b
    }
}
pub(crate) const fn round_to_next(x: usize, multiple: NonZeroUsize) -> usize {
    (x + multiple.get() - 1) / multiple.get() * multiple.get()
}

/// Constant equality implementations
pub trait ConstEq {
    /// Constant equality
    fn const_eq(&self, other: &Self) -> bool;
}
/// Constant inequality implementations
pub trait ConstNe {
    /// Constant inequality
    fn const_ne(&self, other: &Self) -> bool;
}
impl<T> const ConstNe for T
where
    T: ~const ConstEq,
{
    fn const_ne(&self, other: &Self) -> bool {
        !self.const_eq(other)
    }
}
impl<'a, T> const ConstEq for &'a T
where
    T: ~const ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        T::const_eq(self, other)
    }
}
impl const ConstEq for u8 {
    fn const_eq(&self, other: &Self) -> bool {
        *self == *other
    }
}
impl const ConstEq for Pubkey {
    fn const_eq(&self, other: &Self) -> bool {
        let own = unsafe { &*(self as *const Pubkey).cast::<[u8; 32]>() };
        let other = unsafe { &*(other as *const Pubkey).cast::<[u8; 32]>() };
        own.const_eq(other)
    }
}
impl<'a, T> const ConstEq for &'a [T]
where
    T: ~const ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        if self.len() != other.len() {
            return false;
        }
        let mut index = 0;
        while index < self.len() {
            if self[index].const_ne(&other[index]) {
                return false;
            }
            index += 1;
        }
        true
    }
}
impl<T, const N: usize> const ConstEq for [T; N]
where
    T: ~const ConstEq,
{
    fn const_eq(&self, other: &Self) -> bool {
        let mut index = 0;
        while index < self.len() {
            if self[index].const_ne(&other[index]) {
                return false;
            }
            index += 1;
        }
        true
    }
}
