// use crate::util::{ConstEq};
use anchor_lang::prelude::*;

pub use solana_program:: {
    program_memory::sol_memcmp
};

/// A public key that uses the system program as the [`None`] value
#[derive(Debug, Clone, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
pub struct OptionalNonSystemPubkey(pub(crate) Pubkey);
// impl OptionalNonSystemPubkey {
//     /// Turns this into an optional pubkey
//     #[must_use]
//     pub const fn into_option(self) -> Option<Pubkey> {
//         if self.0.const_eq(&SystemProgram::<()>::KEY) {
//             None
//         } else {
//             Some(self.0)
//         }
//     }
// }
impl From<OptionalNonSystemPubkey> for Option<Pubkey> {
    fn from(from: OptionalNonSystemPubkey) -> Self {
        if sol_memcmp(from.0.as_ref(), &[0; 32], 32) == 0 {
            None
        } else {
            Some(from.0)
        }
    }
}
// impl const From<Pubkey> for OptionalNonSystemPubkey {
//     fn from(from: Pubkey) -> Self {
//         Self(from)
//     }
// }
// impl const OnChainSize for OptionalNonSystemPubkey {
//     const ON_CHAIN_SIZE: usize = Pubkey::ON_CHAIN_SIZE;
// }
// / [`InPlace::Access`] for [`OptionalNonSystemPubkey`]
// #[derive(Debug, Copy, Clone)]
// pub struct OptionalNonSystemPubkeyAccess<A>(A);
// impl<A> OptionalNonSystemPubkeyAccess<A> {
//     /// Gets this as an optional public key
//     #[must_use]
//     pub const fn get(&self) -> Option<&Pubkey>
//     where
//         A: ~const Deref<Target = Pubkey>,
//     {
//         if self.0.const_eq(&SystemProgram::<()>::KEY) {
//             None
//         } else {
//             Some(&*self.0)
//         }
//     }

//     /// Sets this to the provided public key
//     pub const fn set(&mut self, val: Option<Pubkey>)
//     where
//         A: ~const DerefMut<Target = Pubkey>,
//     {
//         *self.0 = val.unwrap_or(SystemProgram::<()>::KEY);
//     }
// }
// impl InPlace for OptionalNonSystemPubkey {
//     type Access<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef,
//     = OptionalNonSystemPubkeyAccess<<Pubkey as InPlace>::Access<'a, A>>;
//     type AccessMut<'a, A>
//     where
//         Self: 'a,
//         A: 'a + MappableRef + TryMappableRef + MappableRefMut + TryMappableRefMut,
//     = OptionalNonSystemPubkeyAccess<<Pubkey as InPlace>::AccessMut<'a, A>>;
// }
// impl InPlaceCreate for OptionalNonSystemPubkey {
//     #[inline]
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(data: A, arg: ()) -> CruiserResult {
//         Pubkey::create_with_arg(data, arg)
//     }
// }
// impl<'a> InPlaceCreate<&'a OptionalNonSystemPubkey> for OptionalNonSystemPubkey {
//     #[inline]
//     fn create_with_arg<A: DerefMut<Target = [u8]>>(
//         data: A,
//         arg: &'a OptionalNonSystemPubkey,
//     ) -> CruiserResult {
//         Pubkey::create_with_arg(data, &arg.0)
//     }
// }
// impl<R> InPlaceRead<R> for OptionalNonSystemPubkey
// where
//     Pubkey: InPlaceRead<R>,
// {
//     fn read_with_arg<'a, A>(data: A, arg: R) -> CruiserResult<Self::Access<'a, A>>
//     where
//         Self: 'a,
//         A: 'a + Deref<Target = [u8]> + MappableRef + TryMappableRef,
//     {
//         Ok(OptionalNonSystemPubkeyAccess(Pubkey::read_with_arg(
//             data, arg,
//         )?))
//     }
// }
// impl<W> InPlaceWrite<W> for OptionalNonSystemPubkey
// where
//     Pubkey: InPlaceWrite<W>,
// {
//     fn write_with_arg<'a, A>(data: A, arg: W) -> CruiserResult<Self::AccessMut<'a, A>>
//     where
//         Self: 'a,
//         A: 'a
//             + DerefMut<Target = [u8]>
//             + MappableRef
//             + TryMappableRef
//             + MappableRefMut
//             + TryMappableRefMut,
//     {
//         Ok(OptionalNonSystemPubkeyAccess(Pubkey::write_with_arg(
//             data, arg,
//         )?))
//     }
// }