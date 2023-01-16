use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use bitflags::bitflags;

use crate::errors::NetworkErrors;
use crate::instructions::admin::*;
use crate::state::AuthKey;
use crate::util::*;

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
    /// The length of time a pass lasts in seconds. `0` means does not expire.
    pub pass_expire_time: i64,
    /// Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.
    pub network_features: u32,
    /// The fees for this network
    pub fees: Vec<NetworkFeesPercentage>,
    // A set of all supported tokens on the network
    pub supported_tokens: Vec<SupportedToken>,
    /// A set of all active gatekeepers in the network
    pub gatekeepers: Vec<Pubkey>,
    /// The number of auth keys needed to change the `auth_keys`
    pub auth_threshold: u8,
    /// Keys with permissions on the network
    pub auth_keys: Vec<AuthKey>,
    // possible data for network features
    // pub network_features_data: Vec<u8>
}

#[derive(Debug, Default, Clone, Copy, AnchorDeserialize, AnchorSerialize)]
pub struct SupportedToken {
    key: Pubkey,
}

impl OnChainSize for SupportedToken {
    const ON_CHAIN_SIZE: usize = OC_SIZE_PUBKEY;
}

impl GatekeeperNetwork {
    pub fn size(
        fees_count: usize,
        auth_keys: usize,
        gatekeepers: usize,
        supported_tokens: usize,
    ) -> usize {
        OC_SIZE_DISCRIMINATOR
            + OC_SIZE_U8 // version
            + OC_SIZE_PUBKEY // initial_authority
            + OC_SIZE_U32 // network_features
            + OC_SIZE_U8 // auth_threshold
            + OC_SIZE_U64 // pass_expire_time
            + OC_SIZE_U8 // signer_bump
            + OC_SIZE_VEC_PREFIX + NetworkFeesPercentage::ON_CHAIN_SIZE * fees_count // fees
            + OC_SIZE_VEC_PREFIX + AuthKey::ON_CHAIN_SIZE * auth_keys // auth_keys
            + OC_SIZE_VEC_PREFIX + (OC_SIZE_PUBKEY * gatekeepers) // gatekeeper list
            + OC_SIZE_U16 // network_index
            + OC_SIZE_VEC_PREFIX + SupportedToken::ON_CHAIN_SIZE * supported_tokens
        // supported tokens list
    }

    /// Checks if the provided authority exists within the [`GatekeeperNetwork::auth_keys`]
    /// and has the requested flag set or is the guardian authority
    pub fn can_access(&self, authority: &Signer, flag: NetworkKeyFlags) -> bool {
        // Check if the current authority is the guardian authority
        if self.authority == authority.key() {
            return true;
        }

        // Check if the authority is in the list of auth keys with the correct access
        self.auth_keys
            .iter()
            .filter(|key| {
                NetworkKeyFlags::from_bits_truncate(key.flags).contains(flag)
                    && *authority.key == key.key
            })
            .count()
            > 0
    }

    pub fn is_token_supported(&self, mint_account: &Pubkey) -> bool {
        self.supported_tokens
            .iter()
            .any(|token| token.key == *mint_account)
    }

    pub fn set_expire_time(&mut self, pass_expire_time: i64) -> Result<()> {
        self.pass_expire_time = pass_expire_time;

        Ok(())
    }

    pub fn update_auth_keys(&mut self, update_keys: &UpdateKeys, authority: &Signer) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no keys
        if update_keys.add.is_empty() && update_keys.remove.is_empty() {
            // no auth keys to add/remove
            return Ok(());
        }

        // remove the keys if they exist
        for key in update_keys.remove.iter() {
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

        for key in update_keys.add.iter() {
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

    pub fn update_fees(&mut self, fees: &UpdateFees) -> Result<()> {
        // This will skip the next auth check which isn't required if there are no fees
        if fees.add.is_empty() && fees.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }

        // Remove the fees if they exist
        for fee in fees.remove.iter() {
            let fee_index = self.fees.iter().position(|x| x.token == *fee);

            match fee_index {
                Some(index) => self.fees.remove(index),
                None => return Err(error!(NetworkErrors::InsufficientAccessAuthKeys)),
            };
        }

        // Add or update fees
        for fee in fees.add.iter() {
            let fee_index = self.fees.iter().position(|x| x.token == fee.token);

            match fee_index {
                Some(index) => self.fees[index] = *fee,
                None => self.fees.push(*fee),
            }
        }

        Ok(())
    }

    pub fn update_network_features(&mut self, network_features: u32) -> Result<()> {
        self.network_features = network_features;

        Ok(())
    }

    pub fn update_supported_tokens(
        &mut self,
        supported_tokens: &UpdateSupportedTokens,
    ) -> Result<()> {
        if supported_tokens.add.is_empty() && supported_tokens.remove.is_empty() {
            // no fees to add/remove
            return Ok(());
        }

        // Remove the supported tokens if they exist
        for token in supported_tokens.remove.iter() {
            let existing_token = self.supported_tokens.iter().position(|x| x.key == *token);

            match existing_token {
                Some(index) => self.supported_tokens.remove(index),
                None => return Err(error!(NetworkErrors::InsufficientAccessAuthKeys)),
            };
        }

        // Add or update the supported tokens
        for token in supported_tokens.add.iter() {
            let existing_token = self
                .supported_tokens
                .iter()
                .position(|x| x.key == token.key);

            match existing_token {
                Some(index) => self.supported_tokens[index] = *token,
                None => self.supported_tokens.push(*token),
            }
        }
        Ok(())
    }

    pub fn is_closeable(&self) -> bool {
        self.gatekeepers.is_empty()
    }
}

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(Clone, Debug, Default, Eq, PartialEq, Copy, AnchorDeserialize, AnchorSerialize)]
pub struct NetworkFeesPercentage {
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

impl OnChainSize for NetworkFeesPercentage {
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
        /// Key can access the network's vault
        const ACCESS_VAULT = 1 << 9;
        /// Key can set [`GatekeeperNetwork::pass_expire_time`]
        const SET_EXPIRE_TIME = 1 << 10;
        /// Key can set [`GatekeeperNetwork::pass_expire_time`]
        const UPDATE_TOKENS = 1 << 11;
    }
}
impl OnChainSize for NetworkKeyFlags {
    const ON_CHAIN_SIZE: usize = OC_SIZE_U16;
}

#[cfg(test)]
mod tests {
    use crate::errors::NetworkErrors;
    use crate::instructions::admin::{UpdateFees, UpdateKeys};
    use crate::state::{
        AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken,
    };
    use anchor_lang::error;
    use anchor_lang::prelude::Signer;
    use solana_program::account_info::AccountInfo;
    use solana_program::clock::Epoch;
    use solana_program::pubkey::Pubkey;

    #[test]
    fn test_can_access_auth_key_with_same_authority() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );

        assert!(network.can_access(&authority, NetworkKeyFlags::AUTH));
    }

    #[test]
    fn test_can_access_valid_auth_key_with_valid_flag() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );

        assert!(network.can_access(&authority, NetworkKeyFlags::AUTH));
    }

    #[test]
    fn test_can_access_valid_auth_key_with_invalid_flag() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();
        let network = make_network(
            &None,
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );

        assert!(!network.can_access(&authority, NetworkKeyFlags::SET_FEATURES));
    }

    #[test]
    fn test_can_access_invalid_auth_key_with_valid_flag() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let network = make_network(
            &None,
            &None,
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );

        assert!(!network.can_access(&authority, NetworkKeyFlags::AUTH));
    }

    #[test]
    fn test_is_token_supported_valid_token() {
        let token = Pubkey::new_unique();
        let network = make_network(
            &None,
            &None,
            vec![SupportedToken { key: token }],
            &NetworkKeyFlags::AUTH,
        );
        assert!(network.is_token_supported(&token));
    }

    #[test]
    fn test_is_token_supported_invalid_token() {
        let token = Pubkey::new_unique();
        let network = make_network(
            &None,
            &None,
            vec![SupportedToken { key: token }],
            &NetworkKeyFlags::AUTH,
        );
        assert!(!network.is_token_supported(&Pubkey::new_unique()));
    }

    #[test]
    fn test_set_expire_time() {
        let mut network = make_network(
            &None,
            &None,
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        assert_eq!(network.pass_expire_time, 0);
        network.set_expire_time(100).unwrap();
        assert_eq!(network.pass_expire_time, 100);
    }

    #[test]
    fn update_auth_keys_add_key() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let auth_key = AuthKey {
            key: Pubkey::new_unique(),
            flags: NetworkKeyFlags::ADJUST_FEES.bits(),
        };
        let update_keys = UpdateKeys {
            add: vec![auth_key],
            remove: vec![],
        };

        network.update_auth_keys(&update_keys, &authority).unwrap();
        assert_eq!(network.auth_keys.len(), 2);
        assert_eq!(network.auth_keys[0].key, *key);
        assert_eq!(
            network.auth_keys[1].flags,
            NetworkKeyFlags::ADJUST_FEES.bits()
        );
    }

    #[test]
    fn update_auth_keys_remove_key() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let key_to_remove = Pubkey::new_unique();
        let auth_key = AuthKey {
            key: key_to_remove,
            flags: NetworkKeyFlags::ADJUST_FEES.bits(),
        };
        let update_keys = UpdateKeys {
            add: vec![auth_key],
            remove: vec![],
        };

        network.update_auth_keys(&update_keys, &authority).unwrap();
        // Assert key was added
        assert_eq!(network.auth_keys.len(), 2);
        assert_eq!(
            network.auth_keys[1].flags,
            NetworkKeyFlags::ADJUST_FEES.bits()
        );
        let update_keys = UpdateKeys {
            add: vec![],
            remove: vec![key_to_remove],
        };
        network.update_auth_keys(&update_keys, &authority).unwrap();
        // Assert key was removed
        assert_eq!(network.auth_keys.len(), 1);
        assert_eq!(network.auth_keys[0].key, *key);
    }

    #[test]
    fn update_auth_keys_remove_last_key() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let update_keys = UpdateKeys {
            add: vec![],
            remove: vec![*key],
        };

        assert_eq!(
            network.update_auth_keys(&update_keys, &authority),
            Err(error!(NetworkErrors::InvalidKey))
        );
    }

    #[test]
    fn update_auth_keys_change_flag() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let new_auth_key = Pubkey::new_unique();
        let auth_key = AuthKey {
            key: new_auth_key,
            flags: NetworkKeyFlags::SET_FEATURES.bits(),
        };
        let update_keys = UpdateKeys {
            add: vec![auth_key],
            remove: vec![],
        };
        network.update_auth_keys(&update_keys, &authority).unwrap();

        assert_eq!(
            network.auth_keys[1].flags,
            NetworkKeyFlags::SET_FEATURES.bits()
        );
        let auth_key_2 = AuthKey {
            key: new_auth_key,
            flags: NetworkKeyFlags::ADJUST_FEES.bits(),
        };
        let update_keys = UpdateKeys {
            add: vec![auth_key_2],
            remove: vec![],
        };
        network.update_auth_keys(&update_keys, &authority).unwrap();
        assert_eq!(
            network.auth_keys[1].flags,
            NetworkKeyFlags::ADJUST_FEES.bits()
        );
    }

    #[test]
    fn update_fees_add_fee() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let expected_fee = NetworkFeesPercentage {
            token: Pubkey::new_unique(),
            issue: 0,
            refresh: 0,
            expire: 0,
            verify: 0,
        };
        let update_fees = UpdateFees {
            add: vec![expected_fee],
            remove: vec![],
        };
        network.update_fees(&update_fees).unwrap();
        assert_eq!(network.fees.len(), 1);
        assert_eq!(network.fees[0], expected_fee);
    }

    #[test]
    fn update_fees_remove_fee() {
        let key = &Pubkey::new_unique();
        let owner = &Pubkey::new_unique();
        let data = &mut vec![1, 2, 3];
        let lamports = &mut 0;
        let account_info = AccountInfo::new(
            key,
            true,
            true,
            lamports,
            data,
            owner,
            false,
            Epoch::default(),
        );

        let authority = Signer::try_from(&account_info).unwrap();

        let mut network = make_network(
            &Some(authority.clone()),
            &Some(*authority.key),
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            &NetworkKeyFlags::AUTH,
        );
        let new_auth_key = Pubkey::new_unique();
        let update_keys = UpdateKeys {
            add: vec![AuthKey {
                key: new_auth_key,
                flags: NetworkKeyFlags::ADJUST_FEES.bits(),
            }],
            remove: vec![],
        };
        network.update_auth_keys(&update_keys, &authority).unwrap();
        let expected_fee = NetworkFeesPercentage {
            token: Pubkey::new_unique(),
            issue: 0,
            refresh: 0,
            expire: 0,
            verify: 0,
        };
        let update_fees = UpdateFees {
            add: vec![expected_fee],
            remove: vec![],
        };
        network.update_fees(&update_fees).unwrap();
        assert_eq!(network.fees.len(), 1);
        assert_eq!(network.fees[0], expected_fee);

        let update_fees = UpdateFees {
            add: vec![],
            remove: vec![expected_fee.token],
        };

        network.update_fees(&update_fees).unwrap();
        assert_eq!(network.fees.len(), 0);
    }

    fn make_network(
        authority: &Option<Signer>,
        auth_key: &Option<Pubkey>,
        supported_tokens: Vec<SupportedToken>,
        flag: &NetworkKeyFlags,
    ) -> GatekeeperNetwork {
        let binding_authority = Pubkey::new_unique();
        let binding_auth_key = Pubkey::new_unique();
        let authority_pubkey = match authority {
            Some(signer) => signer.key,
            None => &binding_authority,
        };
        let auth_key_pubkey = match auth_key {
            Some(pubkey) => pubkey,
            None => &binding_auth_key,
        };
        let auth_key = AuthKey {
            key: *auth_key_pubkey,
            flags: flag.bits(),
        };

        GatekeeperNetwork {
            version: 0,
            authority: *authority_pubkey,
            network_index: 0,
            pass_expire_time: 0,
            network_features: 0,
            fees: vec![],
            supported_tokens,
            gatekeepers: vec![],
            auth_threshold: 0,
            auth_keys: vec![auth_key],
        }
    }
}
