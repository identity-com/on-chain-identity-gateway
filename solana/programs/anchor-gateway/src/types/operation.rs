// use crate::types::{GatekeeperFees, NetworkFees};
use anchor_lang::prelude::*;

/// A Possible operation on a pass
#[derive(Debug, Copy, Clone, PartialEq, Eq, AnchorDeserialize, AnchorSerialize)]
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
// impl Operation {
//     /// TODO: make this return a `Option<&Pubkey>` somehow
//     pub(crate) fn get_gatekeeper_fee<'a, 'b, A>(
//         self,
//         fees: &'a <GatekeeperFees as InPlace>::Access<'b, A>,
//     ) -> CruiserResult<(Option<Pubkey>, u64)>
//     where
//         A: 'b + MappableRef + TryMappableRef + Deref<Target = [u8]>,
//     {
//         let out = match self {
//             Operation::Issue => get_properties!(fees, GatekeeperFees { token, issue })?,
//             Operation::Refresh => get_properties!(fees, GatekeeperFees { token, refresh })?,
//             Operation::Expire => get_properties!(fees, GatekeeperFees { token, expire })?,
//             Operation::Verify => get_properties!(fees, GatekeeperFees { token, verify })?,
//         };
//         Ok((out.0.get().copied(), out.1.get_num()))
//     }

//     /// TODO: make this return a `Option<&Pubkey>` somehow
//     pub(crate) fn get_network_fee<'a, 'b, A>(
//         self,
//         fees: &'a <NetworkFees as InPlace>::Access<'b, A>,
//     ) -> CruiserResult<(Option<Pubkey>, u16)>
//     where
//         A: 'b + MappableRef + TryMappableRef + Deref<Target = [u8]>,
//     {
//         let out = match self {
//             Operation::Issue => get_properties!(fees, NetworkFees { token, issue })?,
//             Operation::Refresh => get_properties!(fees, NetworkFees { token, refresh })?,
//             Operation::Expire => get_properties!(fees, NetworkFees { token, expire })?,
//             Operation::Verify => get_properties!(fees, NetworkFees { token, verify })?,
//         };
//         Ok((out.0.get().copied(), out.1.get_num()))
//     }
// }