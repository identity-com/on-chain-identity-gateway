use crate::types::{GatekeeperFees, GatekeeperKeyFlags};
use anchor_lang::prelude::*;

// A gatekeeper on a [`GatekeeperNetwork`] that can issue passes
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
    pub fees: [GatekeeperFees; 128],
    /// The keys with permissions on this gatekeeper
    pub auth_keys: [GatekeeperAuthKey; 128],
}

/// The state of a [`Gatekeeper`]
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum GatekeeperState {
    /// Functional gatekeeper
    Active,
    /// Gatekeeper may not issue passes
    Frozen,
    /// Gatekeeper may not issue passes and all passes invalid
    Halted,
}
// TODO: const not valid(?), onChainSize not recognized
// impl const OnChainSize for GatekeeperState {
//     const ON_CHAIN_SIZE: usize = 1;
// }
// [`InPlace::Access`] for [`GatekeeperState`]

// TODO: GetNum and SetNum not recognized
// #[derive(Copy, Clone, Debug)]
// pub struct GatekeeperStateAccess<A>(A);
// impl<A> GatekeeperStateAccess<A>
// where
//     A: GetNum<Num = u8>,
// {
//     // Gets the current state
//     #[inline]
//     pub fn get_state(&self) -> Option<GatekeeperState> {
//         match self.0.get_num() {
//             0 => Some(GatekeeperState::Active),
//             1 => Some(GatekeeperState::Frozen),
//             2 => Some(GatekeeperState::Halted),
//             _ => None,
//         }
//     }

//     // Sets the state
//     #[inline]
//     pub fn set_state(&mut self, state: GatekeeperState)
//     where
//         A: SetNum,
//     {
//         self.0.set_num(state as u8);
//     }
// }
// TODO: Lots of warnings here. this whole impl is red for me
// impl InPlace for GatekeeperState {
//     type Access<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef,
//     = GatekeeperStateAccess<<u8 as InPlace>::Access<'a, A>>;
//     type AccessMut<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
//     = GatekeeperStateAccess<<u8 as InPlace>::AccessMut<'a, A>>;
// }
// TODO: for next four impl, many type or variable keywords not recognized, I'm assuming from Cruiser.
// impl InPlaceCreate for GatekeeperState {
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
//         u8::create_with_arg(data, arg)
//     }
// }
// impl InPlaceCreate<GatekeeperState> for GatekeeperState {
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: GatekeeperState) -> CruiserResult {
//         u8::create_with_arg(data, arg as u8)
//     }
// }
// impl InPlaceRead for GatekeeperState {
//     fn read_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::Access<'a, A>>
//     where
//         Self: 'a,
//         A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
//     {
//         Ok(GatekeeperStateAccess(u8::read_with_arg(data, arg)?))
//     }
// }
// impl InPlaceWrite for GatekeeperState {
//     fn write_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::AccessMut<'a, A>>
//     where
//         Self: 'a,
//         A: 'a
//             + DerefMut<Target = [u8]>
//             + MappableRef
//             + TryMappableRef
//             + MappableRefMut
//             + TryMappableRefMut,
//     {
//         Ok(GatekeeperStateAccess(u8::write_with_arg(data, arg)?))
//     }
// }

// / The authority key for a [`Gatekeeper`]
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct GatekeeperAuthKey {
    /// The permissions this key has
    pub flags: GatekeeperKeyFlags,
    /// The key
    pub key: Pubkey,
}
// TODO: OnChainSize not recognized
// impl OnChainSize for GatekeeperAuthKey {
//     const ON_CHAIN_SIZE: usize = GatekeeperKeyFlags::ON_CHAIN_SIZE + Pubkey::ON_CHAIN_SIZE;
// }
