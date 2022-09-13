use crate::errors::NetworkErrors;
use crate::instructions::*;
use crate::util::*;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use bitflags::bitflags;

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[derive(Debug)]
#[account]
pub struct GatekeeperNetwork {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The initial authority key
    pub initial_authority: Pubkey,
    // /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    // pub network_features: Vec<[u8; 32]>,
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: i64,
    /// The bump for the signer
    pub signer_bump: u8,
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
    pub fn on_chain_size_with_arg(arg: GatekeeperNetworkSize) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8 // version
            + OC_SIZE_PUBKEY // initial_authority
            // + OC_SIZE_U8 * 32 * 12 // network_features
            + OC_SIZE_U8 // auth_threshold
            + OC_SIZE_U64 // pass_expire_time
            + OC_SIZE_U8 // signer_bump
            + OC_SIZE_VEC_PREFIX + NetworkFees::ON_CHAIN_SIZE * arg.fees_count as usize // fees
            + OC_SIZE_VEC_PREFIX + NetworkAuthKey::ON_CHAIN_SIZE * arg.auth_keys as usize
        // auth_keys
    }

    pub fn can_access(&self, authority: &Signer, flag: NetworkKeyFlags) -> bool {
        self.auth_keys
            .iter()
            .filter(|key| {
                NetworkKeyFlags::from_bits_truncate(key.flags).contains(flag)
                    && *authority.key == key.key
            })
            .count()
            > 0
    }

    pub fn set_expire_time(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
        match data.pass_expire_time {
            Some(pass_expire_time) => {
                if pass_expire_time != self.pass_expire_time {
                    if !self.can_access(authority, NetworkKeyFlags::SET_EXPIRE_TIME) {
                        return Err(error!(NetworkErrors::InsufficientAccessExpiry));
                    }

                    self.pass_expire_time = pass_expire_time;
                }

                Ok(())
            }
            None => Ok(()),
        }
    }

    pub fn add_auth_keys(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no keys
        if data.auth_keys.add.is_empty() && data.auth_keys.remove.is_empty() {
            // no auth keys to add/remove
            return Ok(());
        }

        if !self.can_access(authority, NetworkKeyFlags::AUTH) {
            return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
        }

        // remove the keys if they exist
        for key in data.auth_keys.remove.iter() {
            let index: Option<usize> = self.auth_keys.iter().position(|x| x.key == *key);

            if let Some(key_index) = index {
                if self.auth_keys[key_index].key == *authority.key {
                    // Cannot remove own key (TODO?)
                    return Err(error!(NetworkErrors::InvalidKey));
                }

                self.auth_keys.remove(key_index);
            } else {
                return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
            }
        }

        for key in data.auth_keys.add.iter() {
            let index: Option<usize> = self.auth_keys.iter().position(|x| x.key == key.key);

            if let Some(key_index) = index {
                // Don't allow updating the flag and removing AUTH key (TODO: check if other auth keys exist)
                if self.auth_keys[key_index].key == *authority.key
                    && !GatekeeperKeyFlags::contains(
                        &GatekeeperKeyFlags::from_bits_truncate(key.flags),
                        GatekeeperKeyFlags::AUTH,
                    )
                {
                    return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
                }

                // update the key with the new flag if it exists
                self.auth_keys[key_index].flags = key.flags;
            } else {
                self.auth_keys.push(*key);
            }
        }

        Ok(())
    }

    pub fn add_fees(&mut self, data: &UpdateNetworkData, authority: &mut Signer) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no fees
        if data.fees.add.is_empty() && data.fees.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }

        if !self.can_access(authority, NetworkKeyFlags::AUTH) {
            return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
        }

        // remove the fees if they exist
        for fee in data.fees.remove.iter() {
            let index: Option<usize> = self.fees.iter().position(|x| x.token == *fee);

            if index.is_none() {
                return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
            }

            let fee_index = index.unwrap();

            self.fees.remove(fee_index);
        }

        // Add or update fees
        for fee in data.fees.add.iter() {
            let index: Option<usize> = self.fees.iter().position(|x| x.token == fee.token);

            if let Some(fee_index) = index {
                // update the existing key with new fees
                self.fees[fee_index] = *fee;
            } else {
                self.fees.push(*fee);
            }
        }

        Ok(())
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

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, Default, Copy)]
pub struct NetworkFees {
    /// The token for the fee, `None` means fee is invalid
    pub token: Pubkey,
    /// Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).
    pub issue: u16,
    /// Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).
    pub refresh: u16,
    /// Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).
    pub expire: u16,
    /// Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).
    pub verify: u16,
}

impl OnChainSize for NetworkFees {
    const ON_CHAIN_SIZE: usize = OC_SIZE_PUBKEY + OC_SIZE_U16 * 4;
}

/// The fees a gatekeeper/network can take
#[derive(Debug, Clone, Eq, PartialEq, AnchorSerialize, AnchorDeserialize, Copy)]
pub struct GatekeeperFees {
    /// The token for these fees. None value for this means native SOL price
    pub token: Pubkey,
    /// Fees taken at issuance of a new pass in token units or lamports for SOL.
    pub issue: u64,
    /// Fees taken when a pass is refreshed in token units or lamports for SOL.
    pub refresh: u64,
    /// The fee taken when a pass is expired in token units or lamports for SOL.
    /// This should only be used where pass value comes from one-time use.
    pub expire: u64,
    /// The fee taken when a pass is verified in token units or lamports for SOL.
    /// This should only be used where pass value comes from proper use
    pub verify: u64,
}

impl OnChainSize for GatekeeperFees {
    const ON_CHAIN_SIZE: usize = OC_SIZE_PUBKEY + OC_SIZE_U16 * 4;
}

bitflags! {
    /// The flags for a key on a network
    #[derive(AnchorSerialize, AnchorDeserialize, Default)]
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
    #[derive(AnchorSerialize, AnchorDeserialize)]
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
impl OnChainSize for NetworkKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}

impl OnChainSize for GatekeeperKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}
