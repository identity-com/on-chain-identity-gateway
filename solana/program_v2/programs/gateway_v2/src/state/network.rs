use crate::types::{GatekeeperKeyFlags, NetworkFees, NetworkKeyFlags};
use crate::util::*;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use crate::UpdateNetworkData;
use crate::errors::NetworkErrors;

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

            if index.is_none() {
                return Err(error!(NetworkErrors::InsufficientAccessAuthKeys));
            }

            let key_index = index.unwrap();
            if self.auth_keys[key_index].key == *authority.key {
                // Cannot remove own key (TODO?)
                return Err(error!(NetworkErrors::InvalidKey));
            }

            self.auth_keys.remove(key_index);
        }

        for key in data.auth_keys.add.iter() {
            let index: Option<usize> = self.auth_keys.iter().position(|x| x.key == key.key);

            if index.is_none() {
                // add the key ifr it doesn't exist
                self.auth_keys.push(*key);
            } else {
                let key_index = index.unwrap();

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
            }
        }

        Ok(())
    }

    pub fn add_fees(
        &mut self,
        data: &UpdateNetworkData,
        authority: &mut Signer,
    ) -> Result<()> {
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

            if index.is_none() {
                // add the fee if it doesn't exist
                self.fees.push(*fee);
            } else {
                let fee_index = index.unwrap();

                // update the existing key with new fees
                self.fees[fee_index] = *fee;
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
