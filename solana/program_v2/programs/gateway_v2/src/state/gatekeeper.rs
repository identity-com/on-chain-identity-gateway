use anchor_lang::prelude::*;
use bitflags::bitflags;

/// A gatekeeper on a [`GatekeeperNetwork`] that can issue passes
#[derive(Debug, InPlace)]
pub struct Gatekeeper {
    /// The version of this struct, should be 0 until a new version is released
    pub version: u8,
    /// The number of keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork`] this gatekeeper is on
    pub gatekeeper_network: Pubkey,
    /// A pointer to the addresses this gatekeeper uses for discoverability
    pub addresses: Pubkey,
    /// The staking account of this gatekeeper
    pub staking_account: Pubkey,
    /// The state of this gatekeeper
    pub gatekeeper_state: GatekeeperState,
    /// The bump for the signer of this gatekeeper
    pub signer_bump: u8,
    /// The fees for this gatekeeper
    pub fees: Vec<GatekeeperFees>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<GatekeeperAuthKey>,
}

impl Gatekeeper {
    //TODO: Won't work with current structure of auth_keys
    pub fn can_access(&self, authority: &Signer, flag: GatekeeperKeyFlags) -> bool {
        self.auth_keys
            .iter()
            .filter(|key| {
                GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(flag)
                    && *authority.key == key.key
            })
            .count()
            > 0
    }
    // TODO: Won't work with current structure of auth_keys
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

        if !self.can_access(authority, GatekeeperKeyFlags::AUTH) {
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
                return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
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
                    return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
                }

                // update the key with the new flag if it exists
                self.auth_keys[key_index].flags = key.flags;
            } else {
                self.auth_keys.push(*key);
            }
        }

        Ok(())
    }
    // TODO: Won't work with current structure of fees
    pub fn add_fees(&mut self, data: &UpdateGatekeeperData, authority: &mut Signer) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no fees
        if data.fees.add.is_empty() && data.fees.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }

        if !self.can_access(
            authority,
            GatekeeperKeyFlags::ADJUST_FEES | GatekeeperKeyFlags::REMOVE_FEES,
        ) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        // remove the fees if they exist
        for fee in data.fees.remove.iter() {
            let index: Option<usize> = self.fees.iter().position(|x| x.token == *fee);

            if index.is_none() {
                return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
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

    pub fn set_auth_threshold(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.auth_threshold.is_none() {
            // no auth threshold to update
            return Ok(());
        }

        if !self.can_access(authority, GatekeeperKeyFlags::AUTH) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        self.auth_threshold = *data.auth_threshold;
        return Ok(());
    }

    pub fn set_gatekeeper_state(
        &mut self,
        state: &GatekeeperState,
        authority: &mut Signer,
    ) -> Result<()> {
        if state.is_none() {
            // no state to modify
            return Ok(());
        }

        if !self.can_access(authority, GatekeeperKeyFlags::SET_GATEKEEPER_STATE) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        self.gatekeeper_state = *data.gatekeeper_state;

        return Ok(());
    }

    pub fn set_network(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.gatekeeper_network.is_none() {
            // no network to update
            return Ok(());
        }

        // If authority doesn't have sufficient access
        if !self.can_access(authority, GatekeeperKeyFlags::AUTH) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        self.gatekeeper_network = *data.gatekeeper_network;
        return Ok(());
    }

    pub fn set_addresses(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.addresses.is_none() {
            // no addresses to update
            return Ok(());
        }

        // If authority doesn't have sufficient access
        if !self.can_access(authority, GatekeeperKeyFlags::SET_ADDRESSES) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        self.addresses = *data.addresses;
        return Ok(());
    }

    pub fn set_staking_account(
        &mut self,
        data: &UpdateGatekeeperData,
        authority: &mut Signer,
    ) -> Result<()> {
        if data.staking_account.is_none() {
            // no staking account to update
            return Ok(());
        }

        // If authority doesn't have sufficient access
        if !self.can_access(authority, GatekeeperKeyFlags::AUTH) {
            return Err(error!(GatekeeperErrors::InsufficientAccessAuthKeys));
        }

        self.staking_account = *data.staking_account;
        return Ok(());
    }
}

/// The state of a [`Gatekeeper`]
#[derive(Debug, Copy, Clone, Eq, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum GatekeeperState {
    /// Functional gatekeeper
    Active,
    /// Gatekeeper may not issue passes
    Frozen,
    /// Gatekeeper may not issue passes and all passes invalid
    Halted,
}
impl const OnChainSize for GatekeeperState {
    const ON_CHAIN_SIZE: usize = 1;
}

/// The authority key for a [`Gatekeeper`]
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize, InPlace)]
pub struct GatekeeperAuthKey {
    /// The permissions this key has
    pub flags: GatekeeperKeyFlags,
    /// The key
    pub key: Pubkey,
}
impl OnChainSize for GatekeeperAuthKey {
    const ON_CHAIN_SIZE: usize = GatekeeperKeyFlags::ON_CHAIN_SIZE + Pubkey::ON_CHAIN_SIZE;
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
    pub signer_bump: u8,
    /// The fees for this gatekeeper
    pub fees: Vec<GatekeeperFees>,
    /// The keys with permissions on this gatekeeper
    pub auth_keys: Vec<GatekeeperAuthKey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize, Default, Clone, Copy)]
pub struct GatekeeperAuthKey {
    /// The permissions this key has
    pub flags: u16,
    /// The key
    pub key: Pubkey,
}

impl OnChainSize for GatekeeperAuthKey {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16 + OC_SIZE_PUBKEY;
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
         const SET_GATEKEEPER_STATE = 1 << 13
     }
}

impl OnChainSize for GatekeeperKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}
