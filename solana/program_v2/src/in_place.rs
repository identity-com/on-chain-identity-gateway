//! In-place access for gateway types.

use crate::util::{round_to_next, ConstEq, GatekeeperNetworkSize};
use crate::{
    GatekeeperFees, GatekeeperNetwork, GatewayAccountList, NetworkFees, NetworkKeyFlags,
    OptionalNonSystemPubkey, Pubkey, UnixTimestamp,
};
use cruiser::account_argument::{AccountArgument, MultiIndexable, Single, SingleIndexable};
use cruiser::account_list::AccountListItem;
use cruiser::account_types::in_place_account::{Create, InPlaceAccount};
use cruiser::account_types::system_program::SystemProgram;
use cruiser::compressed_numbers::CompressedNumber;
use cruiser::in_place::{
    InPlace, InPlaceCreate, InPlaceGet, InPlaceRead, InPlaceSet, InPlaceUnitRead, InPlaceUnitWrite,
    InPlaceWrite,
};
use cruiser::on_chain_size::{OnChainSize, OnChainStaticSize};
use cruiser::pda_seeds::PDASeedSet;
use cruiser::program::ProgramKey;
use cruiser::solana_program::program_memory::sol_memcpy;
use cruiser::solana_program::rent::Rent;
use cruiser::solana_program::sysvar::Sysvar;
use cruiser::util::Advance;
use cruiser::{AccountInfo, CPIMethod, CruiserResult, ToSolanaAccountInfo};
use std::borrow::Cow;
use std::cmp::Ordering;
use std::num::NonZeroUsize;

/// [`InPlace::Access`] for [`OptionalNonSystemPubkey`]
#[derive(Debug)]
pub struct OptionalNonSystemPubkeyAccess<'a>(<Pubkey as InPlace<'a>>::Access);
impl<'a> OptionalNonSystemPubkeyAccess<'a> {
    /// Gets this as an optional public key
    #[must_use]
    pub const fn get(&self) -> Option<&Pubkey> {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(self.0)
        }
    }
}
/// [`InPlace::AccessMut`] for [`OptionalNonSystemPubkey`]
#[derive(Debug)]
pub struct OptionalNonSystemPubkeyAccessMut<'a>(<Pubkey as InPlace<'a>>::AccessMut);
impl<'a> OptionalNonSystemPubkeyAccessMut<'a> {
    /// Gets this as an optional public key
    #[must_use]
    pub const fn get(&self) -> Option<&Pubkey> {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(&*self.0)
        }
    }

    /// Sets this to the provided public key
    pub const fn set(&mut self, val: Option<Pubkey>) {
        *self.0 = val.unwrap_or(SystemProgram::<()>::KEY);
    }
}
impl<'a> InPlace<'a> for OptionalNonSystemPubkey {
    type Access = OptionalNonSystemPubkeyAccess<'a>;
    type AccessMut = OptionalNonSystemPubkeyAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for OptionalNonSystemPubkey {
    fn create_with_arg(data: &mut [u8], arg: ()) -> CruiserResult {
        Pubkey::create_with_arg(data, arg)
    }
}
impl<'a, 'b> InPlaceCreate<'a, &'b OptionalNonSystemPubkey> for OptionalNonSystemPubkey {
    fn create_with_arg(data: &mut [u8], arg: &'b OptionalNonSystemPubkey) -> CruiserResult {
        Pubkey::create_with_arg(data, &arg.0)
    }
}
impl<'a, R> InPlaceRead<'a, R> for OptionalNonSystemPubkey
where
    Pubkey: InPlaceRead<'a, R>,
{
    fn read_with_arg(data: &'a [u8], arg: R) -> CruiserResult<Self::Access> {
        Ok(OptionalNonSystemPubkeyAccess(Pubkey::read_with_arg(
            data, arg,
        )?))
    }
}
impl<'a, W> InPlaceWrite<'a, W> for OptionalNonSystemPubkey
where
    Pubkey: InPlaceWrite<'a, W>,
{
    fn write_with_arg(data: &'a mut [u8], arg: W) -> CruiserResult<Self::AccessMut> {
        Ok(OptionalNonSystemPubkeyAccessMut(Pubkey::write_with_arg(
            data, arg,
        )?))
    }
}

/// [`InPlace::Access`] for [`GatekeeperFees`]
#[derive(Debug)]
pub struct GatekeeperFeesAccess<'a> {
    /// The token for this fee
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::Access,
    /// The fee taken on issue
    pub issue: <u64 as InPlace<'a>>::Access,
    /// The fee taken on refresh
    pub refresh: <u64 as InPlace<'a>>::Access,
    /// The fee taken on expire
    pub expire: <u64 as InPlace<'a>>::Access,
    /// The fee taken on verify
    pub verify: <u64 as InPlace<'a>>::Access,
}
/// [`InPlace::AccessMut`] for [`GatekeeperFees`]
#[derive(Debug)]
pub struct GatekeeperFeesAccessMut<'a> {
    /// The token for this fee
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::AccessMut,
    /// The fee taken on issue
    pub issue: <u64 as InPlace<'a>>::AccessMut,
    /// The fee taken on refresh
    pub refresh: <u64 as InPlace<'a>>::AccessMut,
    /// The fee taken on expire
    pub expire: <u64 as InPlace<'a>>::AccessMut,
    /// The fee taken on verify
    pub verify: <u64 as InPlace<'a>>::AccessMut,
}
impl<'a> InPlace<'a> for GatekeeperFees {
    type Access = GatekeeperFeesAccess<'a>;
    type AccessMut = GatekeeperFeesAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for GatekeeperFees {
    fn create_with_arg(mut data: &mut [u8], _arg: ()) -> CruiserResult {
        create::<OptionalNonSystemPubkey, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        Ok(())
    }
}
impl<'a, 'b> InPlaceCreate<'a, &'b GatekeeperFees> for GatekeeperFees {
    fn create_with_arg(mut data: &mut [u8], arg: &'b GatekeeperFees) -> CruiserResult {
        create::<OptionalNonSystemPubkey, _, _>(&mut data, &arg.token, ())?;
        create::<u64, _, _>(&mut data, arg.issue, ())?;
        create::<u64, _, _>(&mut data, arg.refresh, ())?;
        create::<u64, _, _>(&mut data, arg.expire, ())?;
        create::<u64, _, _>(&mut data, arg.verify, ())?;
        Ok(())
    }
}
impl<'a> InPlaceRead<'a, ()> for GatekeeperFees {
    fn read_with_arg(mut data: &'a [u8], arg: ()) -> CruiserResult<Self::Access> {
        Ok(GatekeeperFeesAccess {
            token: read::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: read::<u64, _, _>(&mut data, arg, arg)?,
            refresh: read::<u64, _, _>(&mut data, arg, arg)?,
            expire: read::<u64, _, _>(&mut data, arg, arg)?,
            verify: read::<u64, _, _>(&mut data, arg, arg)?,
        })
    }
}
impl<'a> InPlaceWrite<'a, ()> for GatekeeperFees {
    fn write_with_arg(mut data: &'a mut [u8], arg: ()) -> CruiserResult<Self::AccessMut> {
        Ok(GatekeeperFeesAccessMut {
            token: write::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: write::<u64, _, _>(&mut data, arg, arg)?,
            refresh: write::<u64, _, _>(&mut data, arg, arg)?,
            expire: write::<u64, _, _>(&mut data, arg, arg)?,
            verify: write::<u64, _, _>(&mut data, arg, arg)?,
        })
    }
}

/// [`InPlace::Access`] for [`NetworkFees`]
#[derive(Debug)]
pub struct NetworkFeesAccess<'a> {
    /// The token for this fee
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::Access,
    /// The fee taken on issue
    pub issue: <u16 as InPlace<'a>>::Access,
    /// The fee taken on refresh
    pub refresh: <u16 as InPlace<'a>>::Access,
    /// The fee taken on expire
    pub expire: <u16 as InPlace<'a>>::Access,
    /// The fee taken on verify
    pub verify: <u16 as InPlace<'a>>::Access,
}
/// [`InPlace::AccessMut`] for [`NetworkFees`]
#[derive(Debug)]
pub struct NetworkFeesAccessMut<'a> {
    /// The token for this fee
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::AccessMut,
    /// The fee taken on issue
    pub issue: <u16 as InPlace<'a>>::AccessMut,
    /// The fee taken on refresh
    pub refresh: <u16 as InPlace<'a>>::AccessMut,
    /// The fee taken on expire
    pub expire: <u16 as InPlace<'a>>::AccessMut,
    /// The fee taken on verify
    pub verify: <u16 as InPlace<'a>>::AccessMut,
}
impl<'a> InPlace<'a> for NetworkFees {
    type Access = NetworkFeesAccess<'a>;
    type AccessMut = NetworkFeesAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for NetworkFees {
    fn create_with_arg(mut data: &mut [u8], _arg: ()) -> CruiserResult {
        create::<OptionalNonSystemPubkey, _, _>(&mut data, (), ())?;
        create::<u16, _, _>(&mut data, (), ())?;
        create::<u16, _, _>(&mut data, (), ())?;
        create::<u16, _, _>(&mut data, (), ())?;
        create::<u16, _, _>(&mut data, (), ())?;
        Ok(())
    }
}
impl<'a, 'b> InPlaceCreate<'a, &'b NetworkFees> for NetworkFees {
    fn create_with_arg(mut data: &mut [u8], arg: &'b NetworkFees) -> CruiserResult {
        create::<OptionalNonSystemPubkey, _, _>(&mut data, &arg.token, ())?;
        create::<u16, _, _>(&mut data, arg.issue, ())?;
        create::<u16, _, _>(&mut data, arg.refresh, ())?;
        create::<u16, _, _>(&mut data, arg.expire, ())?;
        create::<u16, _, _>(&mut data, arg.verify, ())?;
        Ok(())
    }
}
impl<'a> InPlaceRead<'a, ()> for NetworkFees {
    fn read_with_arg(mut data: &'a [u8], arg: ()) -> CruiserResult<Self::Access> {
        Ok(NetworkFeesAccess {
            token: read::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: read::<u16, _, _>(&mut data, arg, arg)?,
            refresh: read::<u16, _, _>(&mut data, arg, arg)?,
            expire: read::<u16, _, _>(&mut data, arg, arg)?,
            verify: read::<u16, _, _>(&mut data, arg, arg)?,
        })
    }
}
impl<'a> InPlaceWrite<'a, ()> for NetworkFees {
    fn write_with_arg(mut data: &'a mut [u8], arg: ()) -> CruiserResult<Self::AccessMut> {
        Ok(NetworkFeesAccessMut {
            token: write::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: write::<u16, _, _>(&mut data, arg, arg)?,
            refresh: write::<u16, _, _>(&mut data, arg, arg)?,
            expire: write::<u16, _, _>(&mut data, arg, arg)?,
            verify: write::<u16, _, _>(&mut data, arg, arg)?,
        })
    }
}

/// [`InPlace::Access`] for [`NetworkKeyFlags`]
#[derive(Debug)]
pub struct NetworkKeyFlagsAccess<'a>(<u16 as InPlace<'a>>::Access);
impl<'a> NetworkKeyFlagsAccess<'a> {
    /// Gets the flags
    #[must_use]
    pub fn get(&self) -> NetworkKeyFlags {
        NetworkKeyFlags::from_bits(self.0.get_in_place()).expect("invalid network key flags")
    }
}
/// [`InPlace::AccessMut`] for [`NetworkKeyFlags`]
#[derive(Debug)]
pub struct NetworkKeyFlagsAccessMut<'a>(<u16 as InPlace<'a>>::AccessMut);
impl<'a> NetworkKeyFlagsAccessMut<'a> {
    /// Gets the flags
    #[must_use]
    pub fn get(&self) -> NetworkKeyFlags {
        NetworkKeyFlags::from_bits(self.0.get_in_place()).expect("invalid network key flags")
    }

    /// Sets the flags
    pub fn set(&mut self, flags: NetworkKeyFlags) {
        self.0.set_in_place(flags.bits());
    }
}
impl<'a> InPlace<'a> for NetworkKeyFlags {
    type Access = NetworkKeyFlagsAccess<'a>;
    type AccessMut = NetworkKeyFlagsAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for NetworkKeyFlags {
    fn create_with_arg(mut data: &mut [u8], _arg: ()) -> CruiserResult {
        create::<u16, _, _>(&mut data, (), ())?;
        Ok(())
    }
}
impl<'a> InPlaceRead<'a, ()> for NetworkKeyFlags {
    fn read_with_arg(mut data: &'a [u8], arg: ()) -> CruiserResult<Self::Access> {
        Ok(NetworkKeyFlagsAccess(read::<u16, _, _>(
            &mut data, arg, arg,
        )?))
    }
}
impl<'a> InPlaceWrite<'a, ()> for NetworkKeyFlags {
    fn write_with_arg(mut data: &'a mut [u8], arg: ()) -> CruiserResult<Self::AccessMut> {
        Ok(NetworkKeyFlagsAccessMut(write::<u16, _, _>(
            &mut data, arg, arg,
        )?))
    }
}

/// Argument for creating a gatekeeper network
#[derive(Debug)]
pub struct GatewayNetworkCreate<'a, AI, CPI> {
    /// The system program
    pub system_program: &'a SystemProgram<AI>,
    /// The rent, defaults to [`Rent::get`]
    pub rent: Option<Rent>,
    /// The funder of the account
    pub funder: &'a AI,
    /// The seeds for the funder if pda
    pub funder_seeds: Option<&'a PDASeedSet<'a>>,
    /// The CPI method to use
    pub cpi: CPI,
}

#[cfg(not(feature = "realloc"))]
const INITIAL_NETWORK_SPACE: usize = 10 * (1 << 10);
#[cfg(feature = "realloc")]
const INITIAL_NETWORK_SPACE: usize =
    GatekeeperNetwork::on_chain_max_size(crate::util::GatekeeperNetworkSize {
        fees_count: 0,
        auth_keys: 1,
    });

/// Account argument for [`GatekeeperNetwork`].
#[derive(Debug, AccountArgument)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[validate(data = ())]
#[validate(id = create, data = (create: GatewayNetworkCreate<'a, AI, CPI>), generics = [<'a, CPI> where CPI: CPIMethod, AI: ToSolanaAccountInfo<'a>])]
pub struct GatewayNetworkAccount<AI>(
    #[validate(id = create, data = Create{
        data: (),
        system_program: create.system_program,
        rent: create.rent,
        funder: create.funder,
        funder_seeds: create.funder_seeds,
        cpi: create.cpi,
        account_seeds: None,
        space: INITIAL_NETWORK_SPACE,
    })]
    InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>,
);
impl<AI> GatewayNetworkAccount<AI> {
    /// Pushes a new fee to the network.
    pub fn push_fees<'a>(
        &self,
        fees: impl ExactSizeIterator<Item = &'a NetworkFees>,
        funds: &AI,
        funder_seeds: Option<&'a PDASeedSet<'a>>,
        rent: Option<&Rent>,
        system_program: &SystemProgram<AI>,
        cpi: impl CPIMethod,
    ) -> CruiserResult
    where
        AI: ToSolanaAccountInfo<'a>,
    {
        let mut data = self.0.info().data_mut();
        let mut network = GatekeeperNetwork::write(&mut *data)?;
        let fee_count = network.fees_count.get_in_place();
        let new_fees_count = fee_count + u16::try_from(fees.len()).expect("too many fees");
        #[cfg(feature = "realloc")]
        unsafe {
            let auth_keys_count = network.auth_keys_count.get_in_place();
            drop(network);
            drop(data);

            let new_length =
                <GatewayAccountList as AccountListItem<GatekeeperNetwork>>::compressed_discriminant(
                )
                .num_bytes()
                    + GatekeeperNetwork::on_chain_max_size(GatekeeperNetworkSize {
                        fees_count: new_fees_count,
                        auth_keys: auth_keys_count,
                    });
            self.0.info().realloc_unsafe(new_length, false)?;

            let current_rent: u64 = *self.0.info().lamports();
            let new_rent = match rent {
                None => Cow::Owned(Rent::get()?),
                Some(rent) => Cow::Borrowed(rent),
            }
            .minimum_balance(new_length);
            match current_rent.cmp(&new_rent) {
                Ordering::Greater => {
                    *self.0.info().lamports_mut() = new_rent;
                    *funds.lamports_mut() += current_rent - new_rent;
                }
                Ordering::Less => {
                    system_program.transfer(
                        cpi,
                        funds,
                        self.0.info(),
                        new_rent - current_rent,
                        funder_seeds,
                    )?;
                }
                Ordering::Equal => {}
            }

            data = self.0.info().data_mut();
            network = GatekeeperNetwork::write(&mut *data)?;
        }
        let initial_offset = GatekeeperNetwork::auth_keys_offset(fee_count);
        let new_offset = GatekeeperNetwork::auth_keys_offset(new_fees_count);
        let offset_change = new_offset - initial_offset;
        if offset_change != 0 {
            let mut remaining_data = &mut *network.remaining_data;
            remaining_data.try_advance(initial_offset)?;
            let source = remaining_data.try_advance(offset_change)?;
            remaining_data.try_advance(
                GatekeeperNetwork::auth_keys_end_offset(
                    fee_count,
                    network.auth_keys_count.get_in_place(),
                ) - offset_change
                    - initial_offset,
            )?;
            let destination = remaining_data.try_advance(offset_change)?;
            sol_memcpy(destination, source, offset_change);
        }
        let mut remaining_data = &mut *network.remaining_data;
        remaining_data.try_advance(GatekeeperNetwork::fees_end_offset(fee_count))?;
        for fee in fees {
            NetworkFees::create_with_arg(
                remaining_data.try_advance(GatekeeperFees::on_chain_static_size())?,
                fee,
            )?;
        }
        network.fees_count.set_in_place(new_fees_count);
        Ok(())
    }
}
impl<AI, I> MultiIndexable<I> for GatewayNetworkAccount<AI>
where
    AI: MultiIndexable<I> + AccountInfo,
{
    fn index_is_signer(&self, indexer: I) -> CruiserResult<bool> {
        self.0.index_is_signer(indexer)
    }
    fn index_is_writable(&self, indexer: I) -> CruiserResult<bool> {
        self.0.index_is_writable(indexer)
    }
    fn index_is_owner(&self, owner: &Pubkey, indexer: I) -> CruiserResult<bool> {
        self.0.index_is_owner(owner, indexer)
    }
}
impl<AI, I> SingleIndexable<I> for GatewayNetworkAccount<AI>
where
    AI: SingleIndexable<I> + AccountInfo,
{
    fn index_info(&self, indexer: I) -> CruiserResult<&Self::AccountInfo> {
        self.0.index_info(indexer)
    }
}

/// [`InPlace::Access`] for [`GatekeeperNetwork`]
#[derive(Debug)]
pub struct GatekeeperNetworkAccess<'a> {
    /// The version of the gatekeeper network
    pub version: <u8 as InPlace<'a>>::Access,
    /// The features of the gatekeeper network
    pub network_features: <[[u8; 32]; 128] as InPlace<'a>>::Access,
    /// The auth threshold of the gatekeeper network
    pub auth_threshold: <u8 as InPlace<'a>>::Access,
    /// The pass expire time of the gatekeeper network
    pub pass_expire_time: <UnixTimestamp as InPlace<'a>>::Access,
    /// The length of network data on passes
    pub network_data_len: <u16 as InPlace<'a>>::Access,
    /// The bump of the signer
    pub signer_bump: <u8 as InPlace<'a>>::Access,
    /// The number of fees
    pub fees_count: <u16 as InPlace<'a>>::Access,
    /// The number of auth keys
    pub auth_keys_count: <u16 as InPlace<'a>>::Access,
    remaining_data: &'a [u8],
}
/// [`InPlace::AccessMut`] for [`GatekeeperNetwork`]
#[derive(Debug)]
pub struct GatekeeperNetworkAccessMut<'a> {
    /// The version of the gatekeeper network
    pub version: <u8 as InPlace<'a>>::AccessMut,
    /// The features of the gatekeeper network
    pub network_features: <[[u8; 32]; 128] as InPlace<'a>>::AccessMut,
    /// The auth threshold of the gatekeeper network
    pub auth_threshold: <u8 as InPlace<'a>>::AccessMut,
    /// The pass expire time of the gatekeeper network
    pub pass_expire_time: <UnixTimestamp as InPlace<'a>>::AccessMut,
    /// The length of network data on passes
    pub network_data_len: <u16 as InPlace<'a>>::AccessMut,
    /// The bump of the signer
    pub signer_bump: <u8 as InPlace<'a>>::AccessMut,
    /// The number of fees
    pub fees_count: <u16 as InPlace<'a>>::AccessMut,
    /// The number of auth keys
    pub auth_keys_count: <u16 as InPlace<'a>>::AccessMut,
    remaining_data: &'a mut [u8],
}
impl GatekeeperNetwork {
    const FEE_SLOT_SIZE: NonZeroUsize =
        NonZeroUsize::new(<NetworkFees>::on_chain_static_size()).unwrap();
    const AUTH_SLOT_SIZE: NonZeroUsize =
        NonZeroUsize::new(<(NetworkKeyFlags, Pubkey)>::on_chain_static_size()).unwrap();

    const fn fees_offset() -> usize {
        round_to_next(0, Self::FEE_SLOT_SIZE)
    }

    const fn fees_end_offset(fees_count: u16) -> usize {
        Self::fees_offset() + fees_count as usize * Self::FEE_SLOT_SIZE.get()
    }

    const fn auth_keys_offset(fees_count: u16) -> usize {
        round_to_next(Self::fees_end_offset(fees_count), Self::AUTH_SLOT_SIZE)
    }

    const fn auth_keys_end_offset(fees_count: u16, auth_keys_count: u16) -> usize {
        Self::auth_keys_offset(fees_count) + auth_keys_count as usize * Self::AUTH_SLOT_SIZE.get()
    }
}
mod sealed {
    #[allow(clippy::wildcard_imports)]
    use super::*;

    pub trait GatekeeperNetworkSlotVectorsPriv<'a> {
        fn fees_count(&self) -> u16;
        fn auth_keys_count(&self) -> u16;
        fn remaining_data(&self) -> &'a [u8];
    }
    impl<'a> GatekeeperNetworkSlotVectorsPriv<'a> for GatekeeperNetworkAccess<'a> {
        fn fees_count(&self) -> u16 {
            self.fees_count.get_in_place()
        }
        fn auth_keys_count(&self) -> u16 {
            self.auth_keys_count.get_in_place()
        }
        fn remaining_data(&self) -> &'a [u8] {
            self.remaining_data
        }
    }
    pub trait GatekeeperNetworkSlotVectorsMut<'a> {
        fn remaining_data_mut(&mut self) -> &mut &'a mut [u8];
    }
    impl<'a> GatekeeperNetworkSlotVectorsMut<'a> for GatekeeperNetworkAccessMut<'a> {
        fn remaining_data_mut(&mut self) -> &mut &'a mut [u8] {
            &mut self.remaining_data
        }
    }
}

/// Slot vector access for [`GatekeeperNetwork`]
pub trait GatekeeperNetworkSlotVectors<'a>: sealed::GatekeeperNetworkSlotVectorsPriv<'a> {
    /// Gets the fees struct at an index
    fn get_fees_at_index(
        &self,
        index: u16,
    ) -> CruiserResult<Option<<NetworkFees as InPlace<'a>>::Access>> {
        if index >= self.fees_count() {
            return Ok(None);
        }
        let offset = GatekeeperNetwork::fees_offset()
            + index as usize * GatekeeperNetwork::FEE_SLOT_SIZE.get();
        let data = &mut self.remaining_data();
        data.try_advance(offset)?;
        Ok(Some(NetworkFees::read(data)?))
    }
    /// Gets the auth keys at an index
    fn get_auth_keys_at_index(
        &self,
        index: u16,
    ) -> CruiserResult<Option<<(NetworkKeyFlags, Pubkey) as InPlace<'a>>::Access>> {
        if index >= self.auth_keys_count() {
            return Ok(None);
        }
        let offset = GatekeeperNetwork::auth_keys_offset(self.fees_count())
            + index as usize * GatekeeperNetwork::AUTH_SLOT_SIZE.get();
        let data = &mut self.remaining_data();
        data.try_advance(offset)?;
        Ok(Some(<(NetworkKeyFlags, Pubkey)>::read(data)?))
    }
}

impl<'a> InPlace<'a> for GatekeeperNetwork {
    type Access = GatekeeperNetworkAccess<'a>;
    type AccessMut = GatekeeperNetworkAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for GatekeeperNetwork {
    fn create_with_arg(mut data: &mut [u8], _arg: ()) -> CruiserResult {
        let data = &mut data;
        create::<u8, _, _>(data, (), ())?;
        create::<[[u8; 32]; 128], _, _>(data, (), ())?;
        create::<u8, _, _>(data, (), ())?;
        create::<UnixTimestamp, _, _>(data, (), ())?;
        create::<u16, _, _>(data, (), ())?;
        create::<u8, _, _>(data, (), ())?;
        create::<u16, _, _>(data, (), ())?;
        create::<u16, _, _>(data, (), ())?;
        Ok(())
    }
}
impl<'a> InPlaceRead<'a, ()> for GatekeeperNetwork {
    fn read_with_arg(mut data: &'a [u8], _arg: ()) -> CruiserResult<Self::Access> {
        Ok(GatekeeperNetworkAccess {
            version: read::<u8, _, _>(&mut data, (), ())?,
            network_features: read::<[[u8; 32]; 128], _, _>(&mut data, (), ())?,
            auth_threshold: read::<u8, _, _>(&mut data, (), ())?,
            pass_expire_time: read::<UnixTimestamp, _, _>(&mut data, (), ())?,
            network_data_len: read::<u16, _, _>(&mut data, (), ())?,
            signer_bump: read::<u8, _, _>(&mut data, (), ())?,
            fees_count: read::<u16, _, _>(&mut data, (), ())?,
            auth_keys_count: read::<u16, _, _>(&mut data, (), ())?,
            remaining_data: data,
        })
    }
}
impl<'a> InPlaceWrite<'a, ()> for GatekeeperNetwork {
    fn write_with_arg(mut data: &'a mut [u8], _arg: ()) -> CruiserResult<Self::AccessMut> {
        Ok(GatekeeperNetworkAccessMut {
            version: write::<u8, _, _>(&mut data, (), ())?,
            network_features: write::<[[u8; 32]; 128], _, _>(&mut data, (), ())?,
            auth_threshold: write::<u8, _, _>(&mut data, (), ())?,
            pass_expire_time: write::<UnixTimestamp, _, _>(&mut data, (), ())?,
            network_data_len: write::<u16, _, _>(&mut data, (), ())?,
            signer_bump: write::<u8, _, _>(&mut data, (), ())?,
            fees_count: write::<u16, _, _>(&mut data, (), ())?,
            auth_keys_count: write::<u16, _, _>(&mut data, (), ())?,
            remaining_data: data,
        })
    }
}

fn create<'a, T, C, A>(data: &mut &mut [u8], creat_arg: C, size_arg: A) -> CruiserResult
where
    T: InPlaceCreate<'a, C> + OnChainSize<A>,
{
    T::create_with_arg(data.try_advance(T::on_chain_max_size(size_arg))?, creat_arg)
}
fn read<'a, T, R, A>(data: &mut &'a [u8], read_arg: R, size_arg: A) -> CruiserResult<T::Access>
where
    T: InPlaceRead<'a, R> + OnChainSize<A>,
{
    T::read_with_arg(data.try_advance(T::on_chain_max_size(size_arg))?, read_arg)
}
fn write<'a, T, W, A>(
    data: &mut &'a mut [u8],
    write_arg: W,
    size_arg: A,
) -> CruiserResult<T::AccessMut>
where
    T: InPlaceWrite<'a, W> + OnChainSize<A>,
{
    T::write_with_arg(data.try_advance(T::on_chain_max_size(size_arg))?, write_arg)
}
