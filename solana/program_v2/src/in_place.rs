//! In-place access for gateway types.

use crate::util::{round_to_next, ConstEq};
use crate::{
    Fees, GatekeeperNetwork, NetworkKeyFlags, OptionalNonSystemPubkey, Pubkey, UnixTimestamp,
};
use cruiser::account_types::system_program::SystemProgram;
use cruiser::in_place::{
    InPlace, InPlaceCreate, InPlaceGet, InPlaceRead, InPlaceSet, InPlaceUnitRead, InPlaceWrite,
};
use cruiser::on_chain_size::{OnChainSize, OnChainStaticSize};
use cruiser::program::ProgramKey;
use cruiser::util::Advance;
use cruiser::CruiserResult;
use std::num::NonZeroUsize;

#[derive(Debug)]
pub struct OptionalNonSystemPubkeyAccess<'a>(<Pubkey as InPlace<'a>>::Access);
impl<'a> OptionalNonSystemPubkeyAccess<'a> {
    #[must_use]
    pub const fn get(&self) -> Option<&Pubkey> {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(self.0)
        }
    }
}
#[derive(Debug)]
pub struct OptionalNonSystemPubkeyAccessMut<'a>(<Pubkey as InPlace<'a>>::AccessMut);
impl<'a> OptionalNonSystemPubkeyAccessMut<'a> {
    #[must_use]
    pub const fn get(&self) -> Option<&Pubkey> {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(&*self.0)
        }
    }

    pub const fn set(&mut self, val: Option<Pubkey>) {
        *self.0 = val.unwrap_or(SystemProgram::<()>::KEY);
    }
}
impl<'a> InPlace<'a> for OptionalNonSystemPubkey {
    type Access = OptionalNonSystemPubkeyAccess<'a>;
    type AccessMut = OptionalNonSystemPubkeyAccessMut<'a>;
}
impl<'a, C> InPlaceCreate<'a, C> for OptionalNonSystemPubkey
where
    Pubkey: InPlaceCreate<'a, C>,
{
    fn create_with_arg(data: &mut [u8], arg: C) -> CruiserResult {
        Pubkey::create_with_arg(data, arg)
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

#[derive(Debug)]
pub struct FeesAccess<'a> {
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::Access,
    pub issue: <u64 as InPlace<'a>>::Access,
    pub refresh: <u64 as InPlace<'a>>::Access,
    pub expire: <u64 as InPlace<'a>>::Access,
    pub verify: <u64 as InPlace<'a>>::Access,
}
#[derive(Debug)]
pub struct FeesAccessMut<'a> {
    pub token: <OptionalNonSystemPubkey as InPlace<'a>>::AccessMut,
    pub issue: <u64 as InPlace<'a>>::AccessMut,
    pub refresh: <u64 as InPlace<'a>>::AccessMut,
    pub expire: <u64 as InPlace<'a>>::AccessMut,
    pub verify: <u64 as InPlace<'a>>::AccessMut,
}
impl<'a> InPlace<'a> for Fees {
    type Access = FeesAccess<'a>;
    type AccessMut = FeesAccessMut<'a>;
}
impl<'a> InPlaceCreate<'a, ()> for Fees {
    fn create_with_arg(mut data: &mut [u8], _arg: ()) -> CruiserResult {
        create::<OptionalNonSystemPubkey, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        create::<u64, _, _>(&mut data, (), ())?;
        Ok(())
    }
}
impl<'a> InPlaceRead<'a, ()> for Fees {
    fn read_with_arg(mut data: &'a [u8], arg: ()) -> CruiserResult<Self::Access> {
        Ok(FeesAccess {
            token: read::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: read::<u64, _, _>(&mut data, arg, arg)?,
            refresh: read::<u64, _, _>(&mut data, arg, arg)?,
            expire: read::<u64, _, _>(&mut data, arg, arg)?,
            verify: read::<u64, _, _>(&mut data, arg, arg)?,
        })
    }
}
impl<'a> InPlaceWrite<'a, ()> for Fees {
    fn write_with_arg(mut data: &'a mut [u8], arg: ()) -> CruiserResult<Self::AccessMut> {
        Ok(FeesAccessMut {
            token: write::<OptionalNonSystemPubkey, _, _>(&mut data, arg, arg)?,
            issue: write::<u64, _, _>(&mut data, arg, arg)?,
            refresh: write::<u64, _, _>(&mut data, arg, arg)?,
            expire: write::<u64, _, _>(&mut data, arg, arg)?,
            verify: write::<u64, _, _>(&mut data, arg, arg)?,
        })
    }
}

#[derive(Debug)]
pub struct NetworkKeyFlagsAccess<'a>(<u16 as InPlace<'a>>::Access);
impl<'a> NetworkKeyFlagsAccess<'a> {
    #[must_use]
    pub fn get(&self) -> NetworkKeyFlags {
        NetworkKeyFlags::from_bits(self.0.get_in_place()).expect("invalid network key flags")
    }
}
#[derive(Debug)]
pub struct NetworkKeyFlagsAccessMut<'a>(<u16 as InPlace<'a>>::AccessMut);
impl<'a> NetworkKeyFlagsAccessMut<'a> {
    #[must_use]
    pub fn get(&self) -> NetworkKeyFlags {
        NetworkKeyFlags::from_bits(self.0.get_in_place()).expect("invalid network key flags")
    }

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

#[derive(Debug)]
pub struct GatekeeperNetworkAccess<'a> {
    pub version: <u8 as InPlace<'a>>::Access,
    pub network_features: <[[u8; 32]; 128] as InPlace<'a>>::Access,
    pub auth_threshold: <u8 as InPlace<'a>>::Access,
    pub pass_expire_time: <UnixTimestamp as InPlace<'a>>::Access,
    pub network_data_len: <u16 as InPlace<'a>>::Access,
    pub signer_bump: <u8 as InPlace<'a>>::Access,
    pub fees_count: <u16 as InPlace<'a>>::Access,
    pub auth_keys_count: <u16 as InPlace<'a>>::Access,
    pub remaining_data: &'a [u8],
}
#[derive(Debug)]
pub struct GatekeeperNetworkAccessMut<'a> {
    pub version: <u8 as InPlace<'a>>::AccessMut,
    pub network_features: <[[u8; 32]; 128] as InPlace<'a>>::AccessMut,
    pub auth_threshold: <u8 as InPlace<'a>>::AccessMut,
    pub pass_expire_time: <UnixTimestamp as InPlace<'a>>::AccessMut,
    pub network_data_len: <u16 as InPlace<'a>>::AccessMut,
    pub signer_bump: <u8 as InPlace<'a>>::AccessMut,
    pub fees_count: <u16 as InPlace<'a>>::AccessMut,
    pub auth_keys_count: <u16 as InPlace<'a>>::AccessMut,
    pub remaining_data: &'a mut [u8],
}
impl GatekeeperNetwork {
    const FEE_SLOT_SIZE: NonZeroUsize = NonZeroUsize::new(<Fees>::on_chain_static_size()).unwrap();
    const AUTH_SLOT_SIZE: NonZeroUsize =
        NonZeroUsize::new(<(NetworkKeyFlags, Pubkey)>::on_chain_static_size()).unwrap();

    const fn fees_offset() -> usize {
        round_to_next(0, Self::FEE_SLOT_SIZE)
    }

    const fn auth_keys_offset(fees_count: u16) -> usize {
        round_to_next(
            Self::fees_offset() + fees_count as usize * Self::FEE_SLOT_SIZE.get(),
            Self::AUTH_SLOT_SIZE,
        )
    }
}
pub trait GatekeeperNetworkSlotVectors<'a> {
    fn fees_count(&self) -> u16;
    fn auth_keys_count(&self) -> u16;
    fn remaining_data(&self) -> &'a [u8];

    fn get_fees_at_index(
        &self,
        index: u16,
    ) -> CruiserResult<Option<<Fees as InPlace<'a>>::Access>> {
        if index >= self.fees_count() {
            return Ok(None);
        }
        let offset = GatekeeperNetwork::fees_offset()
            + index as usize * GatekeeperNetwork::FEE_SLOT_SIZE.get();
        let data = &mut self.remaining_data();
        data.try_advance(offset)?;
        Ok(Some(Fees::read(data)?))
    }
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
pub trait GatekeeperNetworkSlotVectorsMut<'a> {
    fn remaining_data_mut(&mut self) -> &mut &'a mut [u8];
}

impl<'a> GatekeeperNetworkSlotVectors<'a> for GatekeeperNetworkAccess<'a> {
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
impl<'a> GatekeeperNetworkSlotVectorsMut<'a> for GatekeeperNetworkAccessMut<'a> {
    fn remaining_data_mut(&mut self) -> &mut &'a mut [u8] {
        &mut self.remaining_data
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
