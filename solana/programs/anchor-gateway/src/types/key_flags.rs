use bitflags::bitflags;
use anchor_lang::prelude::*;

bitflags! {
    /// The flags for a key on a network
    #[derive(AnchorDeserialize, AnchorSerialize)]
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
    #[derive(AnchorDeserialize, AnchorSerialize)]
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
