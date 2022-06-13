use crate::types::NetworkFees;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorSerialize, AnchorDeserialize};
use crate::util::*;

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[derive(Debug)]
#[account]
pub struct GatekeeperNetwork {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    pub network_features: Vec<[u8; 32]>,
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: i64,
    /// Changing this justifies a new network as all old passes will become invalid
    pub network_data_len: u16,
    /// The bump for the signer
    pub signer_bump: u8,
    /// Number of different token fees
    pub fees_count: u16,
    /// Number of auth keys
    pub auth_keys_count: u16,
    /// The fees for this network
    pub fees: Vec<NetworkFees>,
    /// Keys with permissions on the network
    pub auth_keys: Vec<NetworkAuthKey>,
}

/// Size for [`GatekeeperNetwork`]
#[derive(Debug, Copy, Clone)]
pub struct GatekeeperNetworkSize {
    /// The number of fee tokens
    pub fees_count: u16,
    /// The number of auth keys
    pub auth_keys: u16,
}

impl GatekeeperNetwork {
    #[must_use]
    pub fn on_chain_size_with_arg(arg: GatekeeperNetworkSize) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8
            + OC_SIZE_U8 * 32 * 12
            + OC_SIZE_U8
            + OC_SIZE_U64
            + OC_SIZE_U16
            + OC_SIZE_U8
            + OC_SIZE_U16
            + OC_SIZE_U16
            + NetworkFees::ON_CHAIN_SIZE * arg.fees_count as usize
            + NetworkAuthKey::ON_CHAIN_SIZE * arg.auth_keys as usize
    }
}

/// The authority key for a [`GatekeeperNetwork`]
#[derive(Debug, AnchorSerialize, AnchorDeserialize, Default, Clone, Copy)]
pub struct NetworkAuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}

impl OnChainSize for NetworkAuthKey {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16 + OC_SIZE_PUBKEY;
}
