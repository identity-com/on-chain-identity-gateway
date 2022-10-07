use crate::errors::GatekeeperErrors;
use crate::instructions::network::UpdateGatekeeperData;
use crate::util::*;
use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use bitflags::bitflags;

// TODO: Modify methods to require correct authorization.

/// A gatekeeper on a [`GatekeeperNetwork`] that can issue passes
#[derive(Debug)]
#[account]
pub struct Gatekeeper {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// the authority for this gatekeeper
    pub authority: Pubkey,
    /// The bump for the signer of this gatekeeper
    pub gatekeeper_bump: u8,
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Pubkey,
    /// The staking account of this gatekeeper
    pub staking_account: Pubkey,
    /// The state of this gatekeeper
    pub gatekeeper_state: GatekeeperState,
    /// The fees for this gatekeeper
    pub token_fees: Vec<GatekeeperFees>,
    /// The number of keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<GatekeeperAuthKey>,
}

impl Gatekeeper {
    pub fn size(fees_count: usize, auth_keys: usize) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8 // version
            + OC_SIZE_PUBKEY // authority
            + OC_SIZE_U8 // gatekeeper_bump
            + OC_SIZE_PUBKEY // gatekeeper_network
            + OC_SIZE_PUBKEY // staking account
            + GatekeeperState::ON_CHAIN_SIZE // gatekeeper state
            + OC_SIZE_VEC_PREFIX + GatekeeperFees::ON_CHAIN_SIZE * fees_count as usize // fees
            + OC_SIZE_U8 // auth_threshold
            + OC_SIZE_VEC_PREFIX + GatekeeperAuthKey::ON_CHAIN_SIZE * auth_keys as usize
        // auth keys
    }
    // Checks if an authkey has enough authority for an action
    pub fn can_access(&self, authority: &Pubkey, flag: GatekeeperKeyFlags) -> bool {

        self.auth_keys
            .iter()
            .filter(|key| {
                msg!("Testing {} against {}", authority, key.key);
                GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(flag)
                    // && *authority.key == key.key
            })
            .count()
            > 0;

        true
    }
    // Adds auth keys to the gatekeeper
    pub fn add_auth_keys(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no keys
        if data.auth_keys.add.is_empty() && data.auth_keys.remove.is_empty() {
            // no auth keys to add/remove
            return Ok(());
        }

        if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        // remove the keys if they exist
        for key in data.auth_keys.remove.iter() {
            let index: Option<usize> = self.auth_keys.iter().position(|x| x.key == *key);

            if let Some(key_index) = index {
                if self.auth_keys[key_index].key == *authority.key {
                    // Cannot remove own key (TODO?)
                    return Err(error!(GatekeeperErrors::InvalidKey));
                }

                self.auth_keys.remove(key_index);
            } else {
                return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
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
                    return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
                }

                // update the key with the new flag if it exists
                self.auth_keys[key_index].flags = key.flags;
            } else {
                self.auth_keys.push(*key);
            }
        }

        Ok(())
    }
    // Adds fees to gatekeeper
    pub fn add_fees(&mut self, data: &UpdateGatekeeperData, authority: &mut Signer) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no fees
        if data.token_fees.add.is_empty() && data.token_fees.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }

        if !self.can_access(
            &authority.key(),
            GatekeeperKeyFlags::ADJUST_FEES | GatekeeperKeyFlags::REMOVE_FEES,
        ) {
            return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
        }

        // remove the fees if they exist
        for fee in data.token_fees.remove.iter() {
            let index: Option<usize> = self.token_fees.iter().position(|x| x.token == *fee);

            if index.is_none() {
                return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
            }

            let fee_index = index.unwrap();

            self.token_fees.remove(fee_index);
        }

        // Add or update fees
        for fee in data.token_fees.add.iter() {
            let index: Option<usize> = self.token_fees.iter().position(|x| x.token == fee.token);

            if let Some(fee_index) = index {
                // update the existing key with new fees
                self.token_fees[fee_index] = *fee;
            } else {
                self.token_fees.push(*fee);
            }
        }

        Ok(())
    }

    // Allows a network to set the state of the gatekeeper (Active, Frozen, Halted)
    pub fn set_gatekeeper_state(
        &mut self,
        state: &GatekeeperState,
        authority: &mut Signer,
    ) -> Result<()> {
        if *state != self.gatekeeper_state {
            if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
                return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
            }

            self.gatekeeper_state = *state;

            // TODO: If gatekeeper_state is set to halted, need to invalidate all passes...
        }

        Ok(())
    }

    // Allows the setting of a new associated gatekeeper network
    pub fn set_network(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        match data.gatekeeper_network {
            Some(gatekeeper_network) => {
                if gatekeeper_network != self.gatekeeper_network {
                    if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
                        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
                    }

                    self.gatekeeper_network = gatekeeper_network;
                }

                Ok(())
            }
            None => Ok(()),
        }
    }

    // Sets the auth threshold for the gatekeeper
    pub fn set_auth_threshold(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        match data.auth_threshold {
            Some(auth_threshold) => {
                if auth_threshold != self.auth_threshold {
                    if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
                        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
                    }

                    self.auth_threshold = auth_threshold;
                }

                Ok(())
            }
            None => Ok(()),
        }
    }

    // sets the staking account for the gatekeeper
    pub fn set_staking_account(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        match data.staking_account {
            Some(staking_account) => {
                if staking_account != self.staking_account {
                    if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
                        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
                    }

                    self.staking_account = staking_account;
                }

                Ok(())
            }
            None => Ok(()),
        }
    }

    // TODO: Change Auth Access
    // controls withdrawal of funds from the gatekeeper
    pub fn gatekeeper_withdraw(&mut self, _receiver: Pubkey, authority: &mut Signer) -> Result<()> {
        if !self.can_access(&authority.key(), GatekeeperKeyFlags::AUTH) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }
        // TODO: Check type of currency,
        // TODO: Transfer to _receiver

        Ok(())
    }
}

/// The state of a [`Gatekeeper`]
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum GatekeeperState {
    /// Functional gatekeeper
    Active = 0,
    /// Gatekeeper may not issue passes
    Frozen = 1,
    /// Gatekeeper may not issue passes and all passes invalid
    Halted = 2,
}

impl OnChainSize for GatekeeperState {
    const ON_CHAIN_SIZE: usize = 1;
}

/// The authority key for a [`Gatekeeper`]
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, Copy)]
pub struct GatekeeperAuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}

impl OnChainSize for GatekeeperAuthKey {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16 + OC_SIZE_PUBKEY;
}

#[derive(Clone, Debug)]
pub struct CreateGatekeeperData {
    /// The number of keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Pubkey,
    /// A pointer to the addresses this gatekeeper uses for discoverability
    pub addresses: Pubkey,
    /// The staking account of this gatekeeper
    pub staking_account: Pubkey,
    /// The bump for the signer of this gatekeeper
    pub gatekeeper_bump: u8,
    /// The fees for this gatekeeper
    pub token_fees: Vec<GatekeeperFees>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<GatekeeperAuthKey>,
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
         /// Key can set gatekeeper state
         const SET_GATEKEEPER_STATE = 1 << 13;
         /// Key can change gatekeepers for passes
         const CHANGE_PASS_GATEKEEPER = 1 << 14;
         /// Key can expire a for passes
         const EXPIRE_PASS = 1 << 15;
     }
}

impl OnChainSize for GatekeeperKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}
