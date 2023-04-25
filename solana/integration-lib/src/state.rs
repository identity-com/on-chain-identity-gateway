//! Program state
use crate::networks::GATEWAY_NETWORKS;
use crate::{Gateway, GatewayError};
use std::convert::TryInto;
use std::mem::{size_of, transmute};
use strum::EnumCount;
use strum_macros::EnumCount as EnumCountMacro;
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    sol_did::{ integrations::is_authority },
    solana_program::{
        account_info::AccountInfo,
        clock::UnixTimestamp,
        entrypoint::ProgramResult,
        program_error::ProgramError,
        pubkey::Pubkey,
        sysvar::{clock::Clock, Sysvar},
    },
};

fn before_now(timestamp: UnixTimestamp, tolerance: u32) -> bool {
    let clock = Clock::get().unwrap();
    (clock.unix_timestamp - (tolerance as i64)) > timestamp
}

/// The seed string used to derive a program address for a gateway token from an owner account
pub const GATEWAY_TOKEN_ADDRESS_SEED: &[u8] = br"gateway";

/// The seed string used to derive a program address for a gateway token from an owner account
pub const GATEKEEPER_ADDRESS_SEED: &[u8] = br"gatekeeper";

/// The seed string used to derive a program address for a network expire feature
pub const NETWORK_EXPIRE_FEATURE_SEED: &[u8] = br"expire";

/// An optional seed to use when generating a gateway token,
/// allowing multiple gateway tokens per wallet
pub type AddressSeed = [u8; 8];

/// Get program-derived gateway token address for the authority
pub fn get_gateway_token_address_with_seed(
    authority: &Pubkey,
    additional_seed: &Option<AddressSeed>,
    network: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &authority.to_bytes(),
            GATEWAY_TOKEN_ADDRESS_SEED,
            &additional_seed.unwrap_or_default(),
            &network.to_bytes(),
        ],
        &Gateway::program_id(),
    )
}

/// Get program-derived gatekeeper address for the authority
pub fn get_gatekeeper_address_with_seed(authority: &Pubkey, network: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &authority.to_bytes(),
            &network.to_bytes(),
            GATEKEEPER_ADDRESS_SEED,
        ],
        &Gateway::program_id(),
    )
}

/// Verifies that the gatekeeper account matches the passed in gatekeeper and gatekeeper network
/// NOTE: This does not check that the gatekeeper is a signer of the transaction.
pub fn verify_gatekeeper(
    gatekeeper_account_info: &AccountInfo,
    gatekeeper: &Pubkey,
    gatekeeper_network: &Pubkey,
) -> Result<(), GatewayError> {
    // Gatekeeper account must be owned by the gateway program
    if gatekeeper_account_info.owner.ne(&Gateway::program_id()) {
        return Err(GatewayError::IncorrectProgramId);
    }

    // Gatekeeper account must be derived correctly from the gatekeeper and gatekeeper network
    let (gatekeeper_address, _gatekeeper_bump_seed) =
        get_gatekeeper_address_with_seed(gatekeeper, gatekeeper_network);
    if gatekeeper_address != *gatekeeper_account_info.key {
        return Err(GatewayError::IncorrectGatekeeper);
    }

    Ok(())
}

// Ignite bump seed is 255 so most optimal create
pub fn get_expire_address_with_seed(network: &Pubkey) -> (Pubkey, u8) {
    for gateway_network in GATEWAY_NETWORKS {
        if &gateway_network.address == network {
            return gateway_network.expire_address;
        }
    }
    Pubkey::find_program_address(
        &[network.as_ref(), NETWORK_EXPIRE_FEATURE_SEED],
        &Gateway::program_id(),
    )
}

/// Defines the gateway token structure
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct GatewayToken {
    /// Feature flags that define the type of gateway token
    pub features: u8,
    /// If the token is a session token,
    /// this is set to the parent token that was used to generate it.
    /// NOTE: DEPRECATED - This is kept to maintain backwards compatibility, but is not used
    pub parent_gateway_token: Option<Pubkey>,
    /// The public key of the wallet to which this token was assigned
    pub owner_wallet: Pubkey,
    /// The DID (must be on Solana) of the identity to which the token was assigned
    /// NOTE: DEPRECATED - This is kept to maintain backwards compatibility, but is not used
    pub owner_identity: Option<Pubkey>,
    /// The gateway network that issued the token
    pub gatekeeper_network: Pubkey,
    /// The specific gatekeeper that issued the token
    pub issuing_gatekeeper: Pubkey,
    /// The current token state
    pub state: GatewayTokenState,

    /// The expiry time of the token (unix timestamp) (expirable tokens only)
    pub expire_time: Option<UnixTimestamp>,
    // /// Details about the transaction that this token has been issued for (session tokens only)
    // pub transaction_details: Option<dyn CompatibleTransactionDetails>
}
impl GatewayToken {
    pub const SIZE: usize = 1 + (1 + 32) + 32 + (1 + 32) + 32 + 32 + 1;
    pub fn new(
        owner_wallet: &Pubkey,
        gatekeeper_network: &Pubkey,
        issuing_gatekeeper: &Pubkey,
        expire_time: &Option<UnixTimestamp>,
    ) -> Self {
        let mut result = Self {
            features: 0,
            parent_gateway_token: None,
            owner_wallet: *owner_wallet,

            owner_identity: None,
            gatekeeper_network: *gatekeeper_network,
            issuing_gatekeeper: *issuing_gatekeeper,
            state: Default::default(),
            expire_time: *expire_time,
        };

        if expire_time.is_some() {
            result.set_feature(Feature::Expirable)
        };

        result
    }

    // TODO should probably do away with the feature bitmap and just infer
    // the features from the properties. This is currently not typesafe as
    // you can set a feature (eg Expirable) without giving the gateway token
    // the appropriate properites (e.g. expire_time). It was added to help
    // serialisation but this is not necessary unless we use traits for different
    // features.
    /// Set a feature flag on a gateway token
    pub fn set_feature(&mut self, feature: Feature) {
        let ordinal = feature as u8;
        self.features |= 1 << ordinal;
    }

    pub fn set_expire_time(&mut self, expire_time: UnixTimestamp) {
        self.set_feature(Feature::Expirable);
        self.expire_time = Some(expire_time);
    }

    pub fn is_valid_state_change(&self, new_state: &GatewayTokenState) -> bool {
        match new_state {
            GatewayTokenState::Active => match self.state {
                GatewayTokenState::Active => false,
                GatewayTokenState::Frozen => true,
                GatewayTokenState::Revoked => false,
            },
            GatewayTokenState::Frozen => match self.state {
                GatewayTokenState::Active => true,
                GatewayTokenState::Frozen => false,
                GatewayTokenState::Revoked => false,
            },
            GatewayTokenState::Revoked => match self.state {
                GatewayTokenState::Active => true,
                GatewayTokenState::Frozen => true,
                GatewayTokenState::Revoked => false,
            },
        }
    }
}

fn pubkey_ref_from_array<'a>(val: &'a [u8; 32]) -> &'a Pubkey {
    // Safe because pubkey is transparent to [u8; 32]
    unsafe { transmute::<&'a [u8; 32], &'a Pubkey>(val) }
}
fn pubkey_mut_ref_from_array<'a>(val: &'a mut [u8; 32]) -> &'a mut Pubkey {
    // Safe because pubkey is transparent to [u8; 32]
    unsafe { transmute::<&'a mut [u8; 32], &'a mut Pubkey>(val) }
}

pub trait GatewayTokenAccess {
    fn features(&self) -> u8;
    fn parent_gateway_token(&self) -> Option<&Pubkey>;
    fn owner_wallet(&self) -> &Pubkey;
    fn owner_identity(&self) -> Option<&Pubkey>;
    fn gatekeeper_network(&self) -> &Pubkey;
    fn issuing_gatekeeper(&self) -> &Pubkey;
    fn state(&self) -> GatewayTokenState;
    fn expire_time(&self) -> Option<UnixTimestamp>;
}
impl GatewayTokenAccess for GatewayToken {
    fn features(&self) -> u8 {
        self.features
    }

    fn parent_gateway_token(&self) -> Option<&Pubkey> {
        self.parent_gateway_token.as_ref()
    }

    fn owner_wallet(&self) -> &Pubkey {
        &self.owner_wallet
    }

    fn owner_identity(&self) -> Option<&Pubkey> {
        self.owner_identity.as_ref()
    }

    fn gatekeeper_network(&self) -> &Pubkey {
        &self.gatekeeper_network
    }

    fn issuing_gatekeeper(&self) -> &Pubkey {
        &self.issuing_gatekeeper
    }

    fn state(&self) -> GatewayTokenState {
        self.state
    }

    fn expire_time(&self) -> Option<UnixTimestamp> {
        self.expire_time
    }
}
pub trait GatewayTokenFunctions: GatewayTokenAccess {
    /// Tests if the gateway token has the required feature
    fn has_feature(&self, feature: Feature) -> bool {
        let ordinal = feature as u8;

        self.features() & (1 << ordinal) != 0
    }

    /// Checks if the gateway token is in a valid state
    /// Note, this does not check ownership or expiry.
    fn is_valid_state(&self) -> bool {
        self.state() == GatewayTokenState::Active
    }

    /// Checks if a gateway token is in a valid state
    fn is_valid(&self) -> bool {
        self.is_valid_state() && !self.has_expired(0)
    }

    fn has_expired(&self, tolerance: u32) -> bool {
        self.has_feature(Feature::Expirable) && before_now(self.expire_time().unwrap(), tolerance)
    }
}
impl<T> GatewayTokenFunctions for T where T: GatewayTokenAccess {}

/// Enum representing the states that a gateway token can be in.
#[derive(Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, BorshSchema)]
pub enum GatewayTokenState {
    /// Valid, non-frozen token. Note - a token may be active but have passed its expire_time.
    Active,
    /// Temporarily paused token.
    Frozen,
    /// A token that has been revoked by the gatekeeper network.
    Revoked,
}
impl GatewayTokenState {
    pub const ALL_STATES: &'static [GatewayTokenState] =
        &[Self::Active, Self::Frozen, Self::Revoked];
}
impl Default for GatewayTokenState {
    fn default() -> Self {
        GatewayTokenState::Active
    }
}

/// Feature flag names. The values are encoded as a bitmap in a gateway token
/// NOTE: There may be only 8 values here, as long as the "features" bitmap is a u8
#[derive(EnumCountMacro)]
pub enum Feature {
    /// The expire_time field must be set and the expire time must not be in the past.
    Expirable,
    /// The following flags are not defined by the protocol, but may be used by gatekeeper networks
    /// to add custom features or restrictions to gateway tokens.
    Custom0,
    Custom1,
    Custom2,
    Custom3,
}
// Enforce that there are no more than 8 features, since they are encoded in a u8 in the gateway token
const_assert!(Feature::COUNT <= 8);

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::test_utils::test_utils_stubs::{init, now};
    use rand::{CryptoRng, Rng, RngCore, SeedableRng};
    use rand_chacha::ChaCha20Rng;
    use solana_sdk::signature::{Keypair, Signer};
    use std::iter::FusedIterator;
    use std::{cell::RefCell, rc::Rc};
    use sol_did::state::{DidAccount, VerificationMethod};
    use sol_did::integrations::derive_did_account;
    use solana_program::system_program;

    fn stub_gateway_token() -> GatewayToken {
        GatewayToken {
            features: 0,
            parent_gateway_token: None,
            owner_wallet: Default::default(),
            owner_identity: None,
            gatekeeper_network: Default::default(),
            issuing_gatekeeper: Default::default(),
            state: Default::default(),
            expire_time: None,
        }
    }

    fn stub_identity(identity_owner: &Keypair) -> DidAccount {
        DidAccount::new(0, &identity_owner.pubkey())
    }

    #[test]
    fn serialize_data() {
        let token = stub_gateway_token();
        let serialized = token.try_to_vec().unwrap();
        let deserialized = GatewayToken::try_from_slice(&serialized).unwrap();
        assert_eq!(token, deserialized);
    }

    #[test]
    fn is_inactive() {
        let mut token = stub_gateway_token();
        token.state = GatewayTokenState::Revoked;
        assert!(!token.is_valid());

        token.state = GatewayTokenState::Frozen;
        assert!(!token.is_valid());
    }

    #[test]
    fn set_feature() {
        let mut token = stub_gateway_token();
        assert!(!token.has_feature(Feature::Expirable));
        token.set_feature(Feature::Expirable);
        assert!(token.has_feature(Feature::Expirable))
    }

    #[test]
    fn has_expired() {
        init();
        let mut token = stub_gateway_token();

        token.set_expire_time(now() - 1000);

        assert!(token.has_expired(0));
        assert!(!token.is_valid());
    }

    fn new_token(
        rng: &mut (impl RngCore + CryptoRng),
        has_parent: bool,
        has_owner_identity: bool,
        has_expire_time: bool,
        state: GatewayTokenState,
    ) -> GatewayToken {
        GatewayToken {
            features: rng.gen(),
            parent_gateway_token: if has_parent {
                Some(Keypair::generate(rng).pubkey())
            } else {
                None
            },
            owner_wallet: Keypair::generate(rng).pubkey(),
            owner_identity: if has_owner_identity {
                Some(Keypair::generate(rng).pubkey())
            } else {
                None
            },
            gatekeeper_network: Keypair::generate(rng).pubkey(),
            issuing_gatekeeper: Keypair::generate(rng).pubkey(),
            state,
            expire_time: if has_expire_time {
                Some(rng.gen())
            } else {
                None
            },
        }
    }

    pub trait CompoundIterator: Iterator + Sized {
        fn compound<I: IntoIterator>(self, other: I) -> CompoundIter<Self, I::IntoIter>
        where
            I::IntoIter: Clone;
    }
    impl<T> CompoundIterator for T
    where
        T: Iterator,
    {
        fn compound<I: IntoIterator>(mut self, other: I) -> CompoundIter<Self, I::IntoIter>
        where
            I::IntoIter: Clone,
        {
            let i2_iter = other.into_iter();
            CompoundIter {
                i2_current: i2_iter.clone(),
                i2: i2_iter,
                i1_current: self.next(),
                i1: self,
            }
        }
    }
    pub struct CompoundIter<I1, I2>
    where
        I1: Iterator,
    {
        i1: I1,
        i1_current: Option<I1::Item>,
        i2: I2,
        i2_current: I2,
    }
    impl<I1, I2> Iterator for CompoundIter<I1, I2>
    where
        I1: Iterator,
        I2: Iterator + Clone,
        I1::Item: Clone,
    {
        type Item = (I1::Item, I2::Item);

        fn next(&mut self) -> Option<Self::Item> {
            loop {
                match &self.i1_current {
                    Some(i1_current) => match self.i2_current.next() {
                        None => {
                            self.i1_current = self.i1.next();
                            self.i2_current = self.i2.clone();
                        }
                        Some(i2) => {
                            return Some((i1_current.clone(), i2));
                        }
                    },
                    None => return None,
                }
            }
        }
    }
    impl<I1, I2> FusedIterator for CompoundIter<I1, I2>
    where
        I1: FusedIterator,
        I2: FusedIterator + Clone,
        I1::Item: Clone,
    {
    }
}
