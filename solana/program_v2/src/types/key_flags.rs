use bitflags::bitflags;
use cruiser::prelude::*;

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
