use crate::types::{NetworkFees, NetworkKeyFlags};
use crate::util::{max, round_to_next};
use cruiser::prelude::*;

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[derive(Debug, InPlace)]
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
    /// The fees for this network
    pub fees: [NetworkFees; 128],
    /// Keys with permissions on the network
    pub auth_keys: [NetworkAuthKey; 128],
}
/// Size for [`GatekeeperNetwork`]
#[derive(Debug, Copy, Clone)]
pub struct GatekeeperNetworkSize {
    /// The number of fee tokens
    pub fees_count: u16,
    /// The number of auth keys
    pub auth_keys: u16,
}
impl OnChainSize for GatekeeperNetwork {
    const ON_CHAIN_SIZE: usize = u8::ON_CHAIN_SIZE
        + <[[u8; 32]; 128]>::ON_CHAIN_SIZE
        + u8::ON_CHAIN_SIZE
        + UnixTimestamp::ON_CHAIN_SIZE
        + u16::ON_CHAIN_SIZE
        + u8::ON_CHAIN_SIZE
        + u16::ON_CHAIN_SIZE
        + u16::ON_CHAIN_SIZE
        + <[NetworkFees; 128]>::ON_CHAIN_SIZE
        + <[NetworkAuthKey; 128]>::ON_CHAIN_SIZE;
}
impl const OnChainSizeWithArg<GatekeeperNetworkSize> for GatekeeperNetwork {
    fn on_chain_size_with_arg(arg: GatekeeperNetworkSize) -> usize {
        let auth_key_size = NetworkAuthKey::ON_CHAIN_SIZE;
        let auth_keys_slot_size = auth_key_size;
        let fee_size = NetworkFees::ON_CHAIN_SIZE;
        let fees_slot_size = max(fee_size, auth_keys_slot_size);

        u8::ON_CHAIN_SIZE
            + <[u8; 33]>::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + u8::ON_CHAIN_SIZE
            + UnixTimestamp::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + u8::ON_CHAIN_SIZE
            + u16::ON_CHAIN_SIZE
            + round_to_next(
                arg.fees_count as usize * fee_size,
                NonZeroUsize::new(fees_slot_size).unwrap_or(NonZeroUsize::new(1).unwrap()),
            )
            + round_to_next(
                arg.auth_keys as usize * auth_key_size,
                NonZeroUsize::new(auth_keys_slot_size).unwrap_or(NonZeroUsize::new(1).unwrap()),
            )
    }
}

/// The authority key for a [`GatekeeperNetwork`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize, InPlace)]
pub struct NetworkAuthKey {
    /// The permissions this key has
    pub flags: NetworkKeyFlags,
    /// The key
    pub key: Pubkey,
}
impl OnChainSize for NetworkAuthKey {
    const ON_CHAIN_SIZE: usize = NetworkKeyFlags::ON_CHAIN_SIZE + Pubkey::ON_CHAIN_SIZE;
}
