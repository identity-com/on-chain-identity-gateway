use anchor_lang::prelude::*;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use bitflags::bitflags;

use crate::errors::NetworkErrors;
use crate::instructions::admin::*;
use crate::state::{AuthKey, UpdateOperands, UpdateOperations};
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

#[derive(Debug, Default, Clone, Copy, AnchorDeserialize, AnchorSerialize, PartialEq, InitSpace)]
pub struct SupportedToken {
    key: Pubkey,
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
            + OC_SIZE_VEC_PREFIX + NetworkFeesPercentage::INIT_SPACE * fees_count // fees
            + OC_SIZE_VEC_PREFIX + AuthKey::INIT_SPACE * auth_keys // auth_keys
            + OC_SIZE_VEC_PREFIX + (OC_SIZE_PUBKEY * gatekeepers) // gatekeeper list
            + OC_SIZE_U16 // network_index
            + OC_SIZE_VEC_PREFIX + SupportedToken::INIT_SPACE * supported_tokens
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

    /// Checks if this network supports a specific feature
    pub fn supports_feature(&self, feature: NetworkFeatures) -> bool {
        NetworkFeatures::from_bits_truncate(self.network_features).contains(feature)
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

    pub fn update_network_features(&mut self, network_features: u32) -> Result<()> {
        self.network_features = network_features;

        Ok(())
    }

    pub fn is_closeable(&self) -> bool {
        self.gatekeepers.is_empty()
    }
}

impl UpdateOperations<UpdateKeys, AuthKey> for GatekeeperNetwork {
    fn operands(this: &mut Self, operation: UpdateKeys) -> UpdateOperands<AuthKey> {
        UpdateOperands::new(&mut this.auth_keys, operation.remove, operation.add)
    }

    fn extract_key(container: &AuthKey) -> Pubkey {
        container.key
    }

    fn missing_key_error() -> Error {
        error!(NetworkErrors::InsufficientAccessAuthKeys)
    }

    fn pre_remove_validation(key: &Pubkey, authority: &Signer) -> Result<()> {
        if key == authority.key {
            Err(error!(NetworkErrors::InvalidKey))
        } else {
            Ok(())
        }
    }

    fn pre_add_validation(container: &AuthKey, authority: &Signer) -> Result<()> {
        if container.key == *authority.key
            && !NetworkKeyFlags::contains(
                &NetworkKeyFlags::from_bits_truncate(container.flags),
                NetworkKeyFlags::AUTH,
            )
        {
            Err(error!(NetworkErrors::InsufficientAccessAuthKeys))
        } else {
            Ok(())
        }
    }
}

impl UpdateOperations<UpdateFees, NetworkFeesPercentage> for GatekeeperNetwork {
    fn operands(this: &mut Self, operation: UpdateFees) -> UpdateOperands<NetworkFeesPercentage> {
        UpdateOperands::new(&mut this.fees, operation.remove, operation.add)
    }

    fn extract_key(container: &NetworkFeesPercentage) -> Pubkey {
        container.token
    }

    fn missing_key_error() -> Error {
        error!(NetworkErrors::InsufficientAccessAuthKeys)
    }

    fn pre_remove_validation(_: &Pubkey, _: &Signer) -> Result<()> {
        Ok(())
    }

    fn pre_add_validation(_: &NetworkFeesPercentage, _: &Signer) -> Result<()> {
        Ok(())
    }
}

impl UpdateOperations<UpdateSupportedTokens, SupportedToken> for GatekeeperNetwork {
    fn operands(
        this: &mut Self,
        operation: UpdateSupportedTokens,
    ) -> UpdateOperands<SupportedToken> {
        UpdateOperands::new(&mut this.supported_tokens, operation.remove, operation.add)
    }

    fn extract_key(container: &SupportedToken) -> Pubkey {
        container.key
    }

    fn missing_key_error() -> Error {
        error!(NetworkErrors::InsufficientAccessAuthKeys)
    }

    fn pre_remove_validation(_: &Pubkey, _: &Signer) -> Result<()> {
        Ok(())
    }

    fn pre_add_validation(_: &SupportedToken, _: &Signer) -> Result<()> {
        Ok(())
    }
}

/// Fees that a [`GatekeeperNetwork`] can charge
#[derive(
    Clone, Debug, Default, Eq, PartialEq, Copy, AnchorDeserialize, AnchorSerialize, InitSpace,
)]
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

     /// The flags for network features
    #[derive(AnchorSerialize, AnchorDeserialize, Default)]
    pub struct NetworkFeatures: u32{
        /// Allows a pass to change gatekeepers
        const CHANGE_PASS_GATEKEEPER = 1 << 0;
    }
}

#[cfg(test)]
mod tests {
    use anchor_lang::error;
    use anchor_lang::prelude::Signer;
    use solana_program::account_info::AccountInfo;
    use solana_program::clock::Epoch;
    use solana_program::pubkey::Pubkey;

    use crate::errors::NetworkErrors;
    use crate::instructions::admin::{UpdateFees, UpdateKeys, UpdateSupportedTokens};
    use crate::state::{
        AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken,
        UpdateOperations,
    };

    #[test]
    fn test_can_access_auth_key_with_same_authority() {
        with_signer(|authority| {
            let network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );

            assert!(network.can_access(&authority, NetworkKeyFlags::AUTH));
        });
    }

    #[test]
    fn test_can_access_valid_auth_key_with_valid_flag() {
        with_signer(|authority| {
            let network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );

            assert!(network.can_access(&authority, NetworkKeyFlags::AUTH));
        });
    }

    #[test]
    fn test_can_access_valid_auth_key_with_invalid_flag() {
        with_signer(|authority| {
            let network = make_network(
                None,
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );

            assert!(!network.can_access(&authority, NetworkKeyFlags::SET_FEATURES));
        });
    }

    #[test]
    fn test_can_access_invalid_auth_key_with_valid_flag() {
        with_signer(|authority| {
            let network = make_network(
                None,
                None,
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );

            assert!(!network.can_access(&authority, NetworkKeyFlags::AUTH));
        });
    }

    #[test]
    fn test_is_token_supported_valid_token() {
        let token = Pubkey::new_unique();
        let network = make_network(
            None,
            None,
            vec![SupportedToken { key: token }],
            NetworkKeyFlags::AUTH,
        );
        assert!(network.is_token_supported(&token));
    }

    #[test]
    fn test_is_token_supported_invalid_token() {
        let token = Pubkey::new_unique();
        let network = make_network(
            None,
            None,
            vec![SupportedToken { key: token }],
            NetworkKeyFlags::AUTH,
        );
        assert!(!network.is_token_supported(&Pubkey::new_unique()));
    }

    #[test]
    fn test_set_expire_time() {
        let mut network = make_network(
            None,
            None,
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            NetworkKeyFlags::AUTH,
        );
        assert_eq!(network.pass_expire_time, 0);
        network.set_expire_time(100).unwrap();
        assert_eq!(network.pass_expire_time, 100);
    }

    #[test]
    fn test_update_auth_keys_remove_key() {
        with_signer(|authority| {
            let mut network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
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
            let original_auth_key = AuthKey {
                flags: NetworkKeyFlags::AUTH.bits(),
                key: *authority.key,
            };

            network.apply_update(update_keys, &authority).unwrap();
            // Assert key was added
            assert_eq!(network.auth_keys, vec![original_auth_key, auth_key]);
            let update_keys = UpdateKeys {
                add: vec![],
                remove: vec![key_to_remove],
            };
            network.apply_update(update_keys, &authority).unwrap();
            // Assert key was removed
            assert_eq!(network.auth_keys, vec![original_auth_key]);
        });
    }

    #[test]
    fn test_update_auth_keys_remove_last_key() {
        with_signer(|authority| {
            let mut network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );
            let update_keys = UpdateKeys {
                add: vec![],
                remove: vec![*authority.key],
            };

            assert_eq!(
                network.apply_update(update_keys, &authority),
                Err(error!(NetworkErrors::InvalidKey))
            );
        });
    }

    #[test]
    fn test_update_auth_keys_change_flag() {
        with_signer(|authority| {
            let mut network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
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

            network.apply_update(update_keys, &authority).unwrap();
            assert_eq!(network.auth_keys[1].flags, auth_key.flags);
            let auth_key_2 = AuthKey {
                key: new_auth_key,
                flags: NetworkKeyFlags::ADJUST_FEES.bits(),
            };
            let update_keys = UpdateKeys {
                add: vec![auth_key_2],
                remove: vec![],
            };
            network.apply_update(update_keys, &authority).unwrap();
            assert_eq!(network.auth_keys[1].flags, auth_key_2.flags);
        });
    }

    #[test]
    fn test_update_fees_remove_fee() {
        with_signer(|authority| {
            let mut network = make_network(
                Some(authority.clone()),
                Some(*authority.key),
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::AUTH,
            );
            let new_auth_key = Pubkey::new_unique();
            let update_keys = UpdateKeys {
                add: vec![AuthKey {
                    key: new_auth_key,
                    flags: NetworkKeyFlags::ADJUST_FEES.bits(),
                }],
                remove: vec![],
            };
            network.apply_update(update_keys, &authority).unwrap();
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
            network.apply_update(update_fees, &authority).unwrap();
            assert_eq!(network.fees, vec![expected_fee]);

            let update_fees = UpdateFees {
                add: vec![],
                remove: vec![expected_fee.token],
            };

            network.apply_update(update_fees, &authority).unwrap();
            assert_eq!(network.fees, vec![]);
        });
    }

    #[test]
    fn test_update_supported_tokens_remove_token() {
        with_signer(|authority| {
            // Assemble
            let mut network = make_network(None, None, vec![], NetworkKeyFlags::empty());

            let new_token = SupportedToken {
                key: Pubkey::new_unique(),
            };

            let update_tokens = UpdateSupportedTokens {
                add: vec![new_token],
                remove: vec![],
            };
            network.apply_update(update_tokens, &authority).unwrap();

            assert_eq!(network.supported_tokens, vec![new_token]);

            let update_tokens = UpdateSupportedTokens {
                add: vec![],
                remove: vec![new_token.key],
            };
            network.apply_update(update_tokens, &authority).unwrap();

            assert_eq!(network.supported_tokens, vec![]);
        });
    }

    #[test]
    fn test_update_supported_tokens_bad_token() {
        with_signer(|authority| {
            // Assemble
            let mut network = make_network(
                None,
                None,
                vec![SupportedToken {
                    key: Pubkey::new_unique(),
                }],
                NetworkKeyFlags::empty(),
            );

            let bad_token = SupportedToken {
                key: Pubkey::new_unique(),
            };

            let update_tokens = UpdateSupportedTokens {
                add: vec![],
                remove: vec![bad_token.key],
            };

            assert_eq!(
                network.apply_update(update_tokens, &authority),
                Err(error!(NetworkErrors::InsufficientAccessAuthKeys))
            );
        });
    }

    #[test]
    fn test_is_closeable() {
        // Assemble
        let network = make_network(
            None,
            None,
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            NetworkKeyFlags::empty(),
        );

        // Act
        // Assert
        assert!(network.is_closeable());
    }

    #[test]
    fn test_is_closeable_not_with_gatekeeper_present() {
        // Assemble
        let mut network = make_network(
            None,
            None,
            vec![SupportedToken {
                key: Pubkey::new_unique(),
            }],
            NetworkKeyFlags::empty(),
        );

        network.gatekeepers = vec![Pubkey::new_unique()];

        // Act
        // Assert
        assert!(!network.is_closeable());
    }

    fn make_network(
        authority: Option<Signer>,
        auth_key: Option<Pubkey>,
        supported_tokens: Vec<SupportedToken>,
        flag: NetworkKeyFlags,
    ) -> GatekeeperNetwork {
        let binding_authority = Pubkey::new_unique();
        let binding_auth_key = Pubkey::new_unique();
        let authority_pubkey = match authority {
            Some(signer) => signer.key,
            None => &binding_authority,
        };
        let auth_key_pubkey = match auth_key {
            Some(pubkey) => pubkey,
            None => binding_auth_key,
        };
        let auth_key = AuthKey {
            key: auth_key_pubkey,
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

    /// Test function to return a signer
    fn with_signer(fnc: fn(Signer) -> ()) {
        let key = Pubkey::new_unique();
        let owner = Pubkey::new_unique();
        let mut data = vec![1, 2, 3];
        let mut lamports = 0;
        let account_info = AccountInfo::new(
            &key,
            true,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );

        let authority: Signer = Signer::try_from(&account_info).unwrap();
        fnc(authority);
    }
}
