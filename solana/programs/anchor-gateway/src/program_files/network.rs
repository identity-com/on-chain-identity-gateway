use crate::types::{NetworkKeyFlags, NetworkFees};
use anchor_lang::prelude::*;
pub use solana_program:: {
    clock::UnixTimestamp
};

#[derive(Debug)]
pub struct GatekeeperNetwork {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    pub network_features: [[u8; 32]; 128],
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: UnixTimestamp,
    /// Changing this justifies a new network as all old passes will become invalid
    pub network_data_len: u16,
    /// The bump for the signer
    pub signer_bump: u8,
    /// Number of different token fees
    pub fees_count: u16,
    /// Number of auth keys
    pub auth_keys_count: u16,
    // The fees for this network
    pub fees: [NetworkFees; 128],
    // Keys with permissions on the network
    pub auth_keys: [NetworkAuthKey; 128],
}

#[derive(Debug, Copy, Clone)]
pub struct GatekeeperNetworkSize {
    /// The number of fee tokens
    pub fees_count: u16,
    /// The number of auth keys
    pub auth_keys: u16,
}

#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct NetworkAuthKey {
    /// The permissions this key has
    pub flags: NetworkKeyFlags,
    /// The key
    pub key: Pubkey
}