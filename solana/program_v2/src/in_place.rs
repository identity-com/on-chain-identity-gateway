//! In-place access for gateway types.

use crate::util::ConstEq;
use crate::{
    GatekeeperKeyFlags, GatekeeperNetwork, GatekeeperState, GatewayAccountList, NetworkKeyFlags,
    OptionalNonSystemPubkey, Pubkey,
};
use cruiser::account_argument::{AccountArgument, MultiIndexable, SingleIndexable};
use cruiser::account_types::in_place_account::{Create, InPlaceAccount};
use cruiser::account_types::system_program::SystemProgram;
use cruiser::in_place::{GetNum, InPlace, InPlaceCreate, InPlaceRead, InPlaceWrite, SetNum};
#[cfg(feature = "realloc")]
use cruiser::on_chain_size::OnChainSizeWithArg;
use cruiser::pda_seeds::PDASeedSet;
use cruiser::program::ProgramKey;
use cruiser::solana_program::rent::Rent;
use cruiser::util::{MappableRef, MappableRefMut, TryMappableRef, TryMappableRefMut};
use cruiser::{AccountInfo, CPIMethod, CruiserResult, ToSolanaAccountInfo};
use std::ops::{Deref, DerefMut};

/// [`InPlace::Access`] for [`OptionalNonSystemPubkey`]
#[derive(Debug, Copy, Clone)]
pub struct OptionalNonSystemPubkeyAccess<A>(A);
impl<A> OptionalNonSystemPubkeyAccess<A> {
    /// Gets this as an optional public key
    #[must_use]
    pub const fn get(&self) -> Option<&Pubkey>
    where
        A: ~const Deref<Target = Pubkey>,
    {
        if self.0.const_eq(&SystemProgram::<()>::KEY) {
            None
        } else {
            Some(&*self.0)
        }
    }

    /// Sets this to the provided public key
    pub const fn set(&mut self, val: Option<Pubkey>)
    where
        A: ~const DerefMut<Target = Pubkey>,
    {
        *self.0 = val.unwrap_or(SystemProgram::<()>::KEY);
    }
}
impl InPlace for OptionalNonSystemPubkey {
    type Access<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef,
    = OptionalNonSystemPubkeyAccess<<Pubkey as InPlace>::Access<'a, A>>;
    type AccessMut<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
    = OptionalNonSystemPubkeyAccess<<Pubkey as InPlace>::AccessMut<'a, A>>;
}
impl InPlaceCreate for OptionalNonSystemPubkey {
    #[inline]
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
        Pubkey::create_with_arg(data, arg)
    }
}
impl<'a> InPlaceCreate<&'a OptionalNonSystemPubkey> for OptionalNonSystemPubkey {
    #[inline]
    fn create_with_arg<A: DerefMut<Target = [u8]>>(
        data: A,
        arg: &'a OptionalNonSystemPubkey,
    ) -> CruiserResult {
        Pubkey::create_with_arg(data, &arg.0)
    }
}
impl<R> InPlaceRead<R> for OptionalNonSystemPubkey
where
    Pubkey: InPlaceRead<R>,
{
    fn read_with_arg<'a, A>(data: A, arg: R) -> CruiserResult<Self::Access<'a, A>>
    where
        Self: 'a,
        A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
    {
        Ok(OptionalNonSystemPubkeyAccess(Pubkey::read_with_arg(
            data, arg,
        )?))
    }
}
impl<W> InPlaceWrite<W> for OptionalNonSystemPubkey
where
    Pubkey: InPlaceWrite<W>,
{
    fn write_with_arg<'a, A>(data: A, arg: W) -> CruiserResult<Self::AccessMut<'a, A>>
    where
        Self: 'a,
        A: 'a
            + DerefMut<Target = [u8]>
            + MappableRef
            + TryMappableRef
            + MappableRefMut
            + TryMappableRefMut,
    {
        Ok(OptionalNonSystemPubkeyAccess(Pubkey::write_with_arg(
            data, arg,
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
    pub funder: Option<&'a AI>,
    /// The seeds for the funder if pda
    pub funder_seeds: Option<&'a PDASeedSet<'a>>,
    /// The CPI method to use
    pub cpi: CPI,
}

#[cfg(not(feature = "realloc"))]
const INITIAL_NETWORK_SPACE: usize =
    cruiser::solana_program::entrypoint::MAX_PERMITTED_DATA_INCREASE;
#[cfg(feature = "realloc")]
const INITIAL_NETWORK_SPACE: usize =
    GatekeeperNetwork::on_chain_size_with_arg(crate::util::GatekeeperNetworkSize {
        fees_count: 0,
        auth_keys: 0,
    });

/// Account argument for [`GatekeeperNetwork`].
#[derive(Debug, AccountArgument)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[validate(data = ())]
#[validate(id = create, data = (create: GatewayNetworkCreate<'a, AI, CPI>), generics = [<'a, 'b, CPI> where CPI: CPIMethod, AI: ToSolanaAccountInfo<'b>])]
pub struct GatekeeperNetworkAccount<AI>(
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
impl<AI> Deref for GatekeeperNetworkAccount<AI> {
    type Target = InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl<AI> DerefMut for GatekeeperNetworkAccount<AI> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
impl<AI, Arg> MultiIndexable<Arg> for GatekeeperNetworkAccount<AI>
where
    AI: AccountInfo,
    InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>: MultiIndexable<Arg>,
{
    fn index_is_signer(&self, indexer: Arg) -> CruiserResult<bool> {
        self.0.index_is_signer(indexer)
    }

    fn index_is_writable(&self, indexer: Arg) -> CruiserResult<bool> {
        self.0.index_is_writable(indexer)
    }

    fn index_is_owner(&self, owner: &Pubkey, indexer: Arg) -> CruiserResult<bool> {
        self.0.index_is_owner(owner, indexer)
    }
}
impl<AI, Arg> SingleIndexable<Arg> for GatekeeperNetworkAccount<AI>
where
    AI: AccountInfo,
    InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>:
        SingleIndexable<Arg, AccountInfo = AI>,
{
    fn index_info(&self, indexer: Arg) -> CruiserResult<&Self::AccountInfo> {
        self.0.index_info(indexer)
    }
}

/// [`InPlace::Access`] for [`NetworkKeyFlags`]
#[derive(Debug)]
pub struct NetworkKeyFlagsAccess<A>(A);
impl<A> NetworkKeyFlagsAccess<A>
where
    A: GetNum<Num = u16>,
{
    /// Gets flags
    pub fn get_flags(&self) -> Option<NetworkKeyFlags> {
        NetworkKeyFlags::from_bits(self.0.get_num())
    }

    /// Sets flags
    pub fn set_flags(&mut self, flags: NetworkKeyFlags)
    where
        A: SetNum,
    {
        self.0.set_num(flags.bits());
    }
}
impl InPlace for NetworkKeyFlags {
    type Access<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef,
    = NetworkKeyFlagsAccess<<u16 as InPlace>::Access<'a, A>>;
    type AccessMut<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
    = NetworkKeyFlagsAccess<<u16 as InPlace>::AccessMut<'a, A>>;
}
impl InPlaceCreate for NetworkKeyFlags {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
        u16::create_with_arg(data, arg)
    }
}
impl InPlaceCreate<NetworkKeyFlags> for NetworkKeyFlags {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: NetworkKeyFlags) -> CruiserResult {
        u16::create_with_arg(data, arg.bits())
    }
}
impl InPlaceRead for NetworkKeyFlags {
    fn read_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::Access<'a, A>>
    where
        Self: 'a,
        A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
    {
        Ok(NetworkKeyFlagsAccess(u16::read_with_arg(data, arg)?))
    }
}
impl InPlaceWrite for NetworkKeyFlags {
    fn write_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::AccessMut<'a, A>>
    where
        Self: 'a,
        A: 'a
            + DerefMut<Target = [u8]>
            + MappableRef
            + TryMappableRef
            + MappableRefMut
            + TryMappableRefMut,
    {
        Ok(NetworkKeyFlagsAccess(u16::write_with_arg(data, arg)?))
    }
}

/// [`InPlace::Access`] for [`GatekeeperKeyFlags`]
#[derive(Debug)]
pub struct GatekeeperKeyFlagsAccess<A>(A);
impl<A> GatekeeperKeyFlagsAccess<A>
where
    A: GetNum<Num = u16>,
{
    /// Gets flags
    pub fn get_flags(&self) -> Option<GatekeeperKeyFlags> {
        GatekeeperKeyFlags::from_bits(self.0.get_num())
    }

    /// Sets flags
    pub fn set_flags(&mut self, flags: GatekeeperKeyFlags)
    where
        A: SetNum,
    {
        self.0.set_num(flags.bits());
    }
}
impl InPlace for GatekeeperKeyFlags {
    type Access<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef,
    = GatekeeperKeyFlagsAccess<<u16 as InPlace>::Access<'a, A>>;
    type AccessMut<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
    = GatekeeperKeyFlagsAccess<<u16 as InPlace>::AccessMut<'a, A>>;
}
impl InPlaceCreate for GatekeeperKeyFlags {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
        u16::create_with_arg(data, arg)
    }
}
impl InPlaceCreate<GatekeeperKeyFlags> for GatekeeperKeyFlags {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(
        data: A,
        arg: GatekeeperKeyFlags,
    ) -> CruiserResult {
        u16::create_with_arg(data, arg.bits())
    }
}
impl InPlaceRead for GatekeeperKeyFlags {
    fn read_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::Access<'a, A>>
    where
        Self: 'a,
        A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
    {
        Ok(GatekeeperKeyFlagsAccess(u16::read_with_arg(data, arg)?))
    }
}
impl InPlaceWrite for GatekeeperKeyFlags {
    fn write_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::AccessMut<'a, A>>
    where
        Self: 'a,
        A: 'a
            + DerefMut<Target = [u8]>
            + MappableRef
            + TryMappableRef
            + MappableRefMut
            + TryMappableRefMut,
    {
        Ok(GatekeeperKeyFlagsAccess(u16::write_with_arg(data, arg)?))
    }
}

/// [`InPlace::Access`] for [`GatekeeperKeyFlags`]
#[derive(Copy, Clone, Debug)]
pub struct GatekeeperStateAccess<A>(A);
impl<A> GatekeeperStateAccess<A>
where
    A: GetNum<Num = u8>,
{
    /// Gets the current state
    #[inline]
    pub fn get_state(&self) -> Option<GatekeeperState> {
        match self.0.get_num() {
            0 => Some(GatekeeperState::Active),
            1 => Some(GatekeeperState::Frozen),
            2 => Some(GatekeeperState::Halted),
            _ => None,
        }
    }

    /// Sets the state
    #[inline]
    pub fn set_state(&mut self, state: GatekeeperState)
    where
        A: SetNum,
    {
        self.0.set_num(state as u8);
    }
}
impl InPlace for GatekeeperState {
    type Access<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef,
    = GatekeeperStateAccess<<u8 as InPlace>::Access<'a, A>>;
    type AccessMut<'a, A>
    where
        Self: 'a,
        A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
    = GatekeeperStateAccess<<u8 as InPlace>::AccessMut<'a, A>>;
}
impl InPlaceCreate for GatekeeperState {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
        u8::create_with_arg(data, arg)
    }
}
impl InPlaceCreate<GatekeeperState> for GatekeeperState {
    fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: GatekeeperState) -> CruiserResult {
        u8::create_with_arg(data, arg as u8)
    }
}
impl InPlaceRead for GatekeeperState {
    fn read_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::Access<'a, A>>
    where
        Self: 'a,
        A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
    {
        Ok(GatekeeperStateAccess(u8::read_with_arg(data, arg)?))
    }
}
impl InPlaceWrite for GatekeeperState {
    fn write_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::AccessMut<'a, A>>
    where
        Self: 'a,
        A: 'a
            + DerefMut<Target = [u8]>
            + MappableRef
            + TryMappableRef
            + MappableRefMut
            + TryMappableRefMut,
    {
        Ok(GatekeeperStateAccess(u8::write_with_arg(data, arg)?))
    }
}
