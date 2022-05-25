use anchor_lang::prelude::*;
pub use solana_program::clock::UnixTimestamp;

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
    /// TODO: Replace with a more generic solution
    pub network_data: [u8; 32],
    /// Additional data from the gatekeeper
    /// TODO: Replace with a more generic solution
    pub gatekeeper_data: [u8; 32],
}

/// Size of a pass
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub struct PassSize {
    /// The length of network data on a pass
    pub network_data_len: u16,
    /// The length of gatekeeper data on a pass
    pub gatekeeper_data_len: u16,
}
// TODO: const not valid, OnChainSizeWithArg not recognized
// impl const OnChainSizeWithArg<PassSize> for Pass {
//     fn on_chain_size_with_arg(arg: PassSize) -> usize {
//         u8::ON_CHAIN_SIZE
//             + UnixTimestamp::ON_CHAIN_SIZE
//             + Pubkey::ON_CHAIN_SIZE * 3
//             + PassState::ON_CHAIN_SIZE
//             + arg.network_data_len as usize
//             + arg.gatekeeper_data_len as usize
//             + arg.gatekeeper_data_len as usize
//     }
// }

/// The state of a [`Pass`].
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum PassState {
    /// Functional pass
    Active,
    /// Pass invalid, can be reactivated
    Frozen,
    /// Pass invalid, cannot be reactivated without network approval
    Revoked,
}
// TODO: const not valid, OnChainSize not recognized
// impl const OnChainSize for PassState {
//     const ON_CHAIN_SIZE: usize = 1;
// }
// // [`InPlace::Access`] for [`PassState`]
// #[derive(Copy, Clone, Debug)]
// pub struct PassStateAccess<A>(A);
// impl<A> PassStateAccess<A>
// where
//     // TODO: GetNum not recognized, SetNum not recognized
//     A: GetNum<Num = u8>,
// {
//     /// Gets the current state
//     #[inline]
//     pub fn get_state(&self) -> Option<PassState> {
//         match self.0.get_num() {
//             0 => Some(PassState::Active),
//             1 => Some(PassState::Frozen),
//             2 => Some(PassState::Revoked),
//             _ => None,
//         }
//     }

//     /// Sets the state
//     #[inline]
//     pub fn set_state(&mut self, state: PassState)
//     where
//         A: SetNum,
//     {
//         self.0.set_num(state as u8);
//     }
// }

// TODO: again the whole impl here is red for me... not sure what to do to fix
// impl InPlace for PassState {
//     type Access<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef,
//     = PassStateAccess<<u8 as InPlace>::Access<'a, A>>;
//     type AccessMut<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
//     = PassStateAccess<<u8 as InPlace>::AccessMut<'a, A>>;
// }

// TODO: For the next four impl, several errors for Types and Variable keywords, probably from Cruiser mostly
// impl InPlaceCreate for PassState {
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
//         u8::create_with_arg(data, arg)
//     }
// }
// impl InPlaceCreate<PassState> for PassState {
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: PassState) -> CruiserResult {
//         u8::create_with_arg(data, arg as u8)
//     }
// }
// impl InPlaceRead for PassState {
//     fn read_with_arg<'a, A>(data: A, arg: ()) -> CruiserResult<Self::Access<'a, A>>
//     where
//         Self: 'a,
//         A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
//     {
//         Ok(PassStateAccess(u8::read_with_arg(data, arg)?))
//     }
// }
// impl InPlaceWrite for PassState {
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
//         Ok(PassStateAccess(u8::write_with_arg(data, arg)?))
//     }
// }
