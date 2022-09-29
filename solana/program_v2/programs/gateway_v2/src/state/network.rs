use crate::errors::NetworkErrors;
use crate::instructions::admin::*;
use crate::util::*;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use bitflags::bitflags;

/// A gatekeeper network which manages many [`Gatekeeper`]s.
#[account]
#[derive(Debug)]
pub struct GatekeeperNetwork {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The initial authority key
    pub authority: Pubkey,
    /// the index of the network
    pub network_index: u16,
    /// The bump for the signer
    pub network_bump: u8,
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: i64,
    /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    pub network_features: u32,
    /// The fees for this network
    pub fees: Vec<NetworkFees>,
    // A set of all supported tokens on the network
    pub supported_tokens: Vec<SupportedToken>,
    /// A set of all active gatekeepers in the network
    pub gatekeepers: Vec<Pubkey>,
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// Keys with permissions on the network
    pub auth_keys: Vec<NetworkAuthKey>,
    // possible data for network features
    // pub network_features_data: Vec<u8>
}

#[derive(Debug, Default, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
pub struct SupportedToken {
    key: Pubkey,
    settlement_info: SettlementInfo,
}

impl OnChainSize for SupportedToken {
    const ON_CHAIN_SIZE: usize = OC_SIZE_PUBKEY + SettlementInfo::ON_CHAIN_SIZE;
}

// TODO: Actual Settlement Info Implementation
#[derive(Debug, Default, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
pub struct SettlementInfo {
    placeholder: u16,
}

impl OnChainSize for SettlementInfo {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}

// TODO! Update size to be correct with new interface
impl GatekeeperNetwork {
    pub fn on_chain_size_with_arg(arg: GatekeeperNetworkSize) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8 // version
            + OC_SIZE_PUBKEY // initial_authority
            // TODO: Add size for network_features
            + OC_SIZE_U32 // network_features
            + OC_SIZE_U8 // auth_threshold
            + OC_SIZE_U64 // pass_expire_time
            + OC_SIZE_U8 // signer_bump
            + OC_SIZE_VEC_PREFIX + NetworkFees::ON_CHAIN_SIZE * arg.fees_count as usize // fees
            + OC_SIZE_VEC_PREFIX + NetworkAuthKey::ON_CHAIN_SIZE * arg.auth_keys as usize
        // auth_keys
        + OC_SIZE_VEC_PREFIX + OC_SIZE_PUBKEY * arg.gatekeepers as usize // gatekeeper list
        + OC_SIZE_U16 // network_index
        + OC_SIZE_VEC_PREFIX + SupportedToken::ON_CHAIN_SIZE * arg.supported_tokens as usize
        // supported tokens list
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

    pub fn update_auth_keys(
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
                    && !NetworkKeyFlags::contains(
                        &NetworkKeyFlags::from_bits_truncate(key.flags),
                        NetworkKeyFlags::AUTH,
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

    pub fn update_fees(&mut self, data: &UpdateNetworkData, authority: &mut Signer) -> Result<()> {
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

    pub fn update_network_features(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
        match data.network_features {
            Some(network_features) => {
                if network_features != self.network_features {
                    if !self.can_access(authority, NetworkKeyFlags::SET_EXPIRE_TIME) {
                        return Err(error!(NetworkErrors::InsufficientAccessExpiry));
                    }

                    self.network_features = network_features
                }

                Ok(())
            }
            None => Ok(()),
        }
    }

    pub fn update_supported_tokens(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.supported_tokens.add.is_empty() && data.supported_tokens.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }
        if !self.can_access(authority, NetworkKeyFlags::AUTH) {
            return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
        }
        for token in data.supported_tokens.remove.iter() {
            let index: Option<usize> = self.supported_tokens.iter().position(|x| x.key == *token);

            if index.is_none() {
                return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
            }

            let token_index = index.unwrap();

            self.supported_tokens.remove(token_index);
        }
        for token in data.supported_tokens.add.iter() {
            let index: Option<usize> = self
                .supported_tokens
                .iter()
                .position(|x| x.key == token.key);

            if let Some(token_index) = index {
                // update the existing key with new fees
                self.supported_tokens[token_index] = *token;
            } else {
                self.supported_tokens.push(*token);
            }
        }
        Ok(())
    }
    pub fn update_gatekeepers(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.gatekeepers.add.is_empty() && data.gatekeepers.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }
        if !self.can_access(authority, NetworkKeyFlags::AUTH) {
            return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
        }
        for gatekeeper in data.gatekeepers.remove.iter() {
            let index: Option<usize> = self
                .gatekeepers
                .iter()
                .position(|pubkey| pubkey == gatekeeper);

            if index.is_none() {
                return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
            }

            let gatekeeper_index = index.unwrap();

            self.gatekeepers.remove(gatekeeper_index);
        }
        for gatekeeper in data.gatekeepers.add.iter() {
            let index: Option<usize> = self
                .gatekeepers
                .iter()
                .position(|pubkey| pubkey == gatekeeper);

            if let Some(gatekeeper_index) = index {
                // update the existing key with new fees
                self.gatekeepers[gatekeeper_index] = *gatekeeper;
            } else {
                self.gatekeepers.push(*gatekeeper);
            }
        }
        Ok(())
    }
}

/// Size for [`GatekeeperNetwork`]
#[derive(Debug, Copy, Clone)]
pub struct GatekeeperNetworkSize {
    /// The number of fee tokens
    pub fees_count: u16,
    /// The number of auth keys
    pub auth_keys: u16,
    pub gatekeepers: u16,
    pub supported_tokens: u16,
}

/// The authority key for a [`GatekeeperNetwork`]
#[derive(Debug, Default, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
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
#[derive(Clone, Debug, Default, Copy, AnchorDeserialize, AnchorSerialize)]
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
}
impl OnChainSize for NetworkKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}
