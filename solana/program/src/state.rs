//! Program state
use crate::networks::GATEKEEPER_NETWORKS_WITH_EXPIRE_ADDRESSES;
use crate::{Gateway, GatewayError};
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        account_info::AccountInfo,
        clock::UnixTimestamp,
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

/// Get program-derived gateway token address for the owner
pub fn get_gateway_token_address_with_seed(
    owner: &Pubkey,
    additional_seed: &Option<AddressSeed>,
    network: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            &owner.to_bytes(),
            GATEWAY_TOKEN_ADDRESS_SEED,
            &additional_seed.unwrap_or_default(),
            &network.to_bytes(),
        ],
        &Gateway::program_id(),
    )
}

/// Get program-derived gatekeeper address for the authority
pub fn get_gatekeeper_account_address(authority: &Pubkey, network: &Pubkey) -> (Pubkey, u8) {
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
pub fn verify_gatekeeper_address_and_account(
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
        get_gatekeeper_account_address(gatekeeper, gatekeeper_network);
    if gatekeeper_address != *gatekeeper_account_info.key {
        return Err(GatewayError::IncorrectGatekeeper);
    }

    Ok(())
}

// Expire feature addresses for gatekeeper networks are PDAs derived from the network address.
// Since the expire feature is frequently used inside a CPI, as a gateway token is "consumed",
// we try to reduce the amount of compute that the expire instruction requires.
// To do this, we precompute and cache the more common gatekeeper network expire addresses and use them here.
pub fn get_expire_address_with_seed(network: &Pubkey) -> (Pubkey, u8) {
    for gateway_network in GATEKEEPER_NETWORKS_WITH_EXPIRE_ADDRESSES {
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
    /// Version flag that allows for future upgrades
    /// Currently ignored and initialised to 0
    pub version: u8,
    /// If the token is a session token,
    /// this is set to the parent token that was used to generate it.
    /// NOTE: DEPRECATED - This is kept to maintain backward compatibility, but is not used
    pub parent_gateway_token: Option<Pubkey>,
    /// The public key of the wallet to which this token was assigned
    pub owner_wallet: Pubkey,
    /// The DID (must be on Solana) of the identity to which the token was assigned
    /// NOTE: DEPRECATED - This is kept to maintain backward compatibility, but is not used
    pub owner_identity: Option<Pubkey>,
    /// The gateway network that issued the token
    pub gatekeeper_network: Pubkey,
    /// The specific gatekeeper that issued the token
    pub issuing_gatekeeper: Pubkey,
    /// The current token state
    pub state: GatewayTokenState,
    /// The expiry time of the token (unix timestamp) (expirable tokens only)
    pub expire_time: Option<UnixTimestamp>,
}
impl GatewayToken {
    // Fix the size of gateway token accounts to ensure that gateway token structs can be resized,
    // for example, if an expire time is added later.
    // Note - to avoid breaking backward compatibility, the unused, and deprecated fields,
    // parent_gateway_token and owner_identity, are fixed to a size of 1.
    // While this is not necessary on the program side, it avoids breaking older typescript clients,
    // which are using borsh's `deserialize` function to read the account data.
    // This function throws an error if the account size exceeds the schema size.
    // Setting these deprecated fields to 1 ensures new gatewaytoken accounts have
    // the same size as all existing gateway token accounts that have `None` set for these values
    // and Some(x) set for expire_time.
    // In conjunction with this change, the client library is updated to use deserializeUnchecked,
    // which allows future GTs to have None set for expire_time without throwing an error.
    pub const SIZE: usize = 1 +
            1 + // parent_gateway_token NOTE - SIZE FIXED TO 1 - DEPRECATED - see note above
            32 +
            1 + // owner_identity NOTE - SIZE FIXED TO 1 - DEPRECATED - see note above
            32 + 32 + 1 + (1 + 8);
    pub fn new(
        owner_wallet: &Pubkey,
        gatekeeper_network: &Pubkey,
        issuing_gatekeeper: &Pubkey,
        expire_time: &Option<UnixTimestamp>,
    ) -> Self {
        Self {
            version: 0,
            parent_gateway_token: None,
            owner_wallet: *owner_wallet,

            owner_identity: None,
            gatekeeper_network: *gatekeeper_network,
            issuing_gatekeeper: *issuing_gatekeeper,
            state: Default::default(),
            expire_time: *expire_time,
        }
    }

    pub fn set_expire_time(&mut self, expire_time: UnixTimestamp) {
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

pub trait GatewayTokenAccess {
    fn owner_wallet(&self) -> &Pubkey;
    fn gatekeeper_network(&self) -> &Pubkey;
    fn issuing_gatekeeper(&self) -> &Pubkey;
    fn state(&self) -> GatewayTokenState;
    fn expire_time(&self) -> Option<UnixTimestamp>;
}
impl GatewayTokenAccess for GatewayToken {
    fn owner_wallet(&self) -> &Pubkey {
        &self.owner_wallet
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
        self.expire_time().is_some() && before_now(self.expire_time().unwrap(), tolerance)
    }
}
impl<T> GatewayTokenFunctions for T where T: GatewayTokenAccess {}

/// Enum representing the states that a gateway token can be in.
#[derive(Default, Copy, Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, BorshSchema)]
pub enum GatewayTokenState {
    /// Valid, non-frozen token. Note - a token may be active but have passed its expire_time.
    #[default]
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

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::test_utils::test_utils_stubs::{init, now};
    use std::iter::FusedIterator;

    fn stub_gateway_token() -> GatewayToken {
        GatewayToken {
            version: 0,
            parent_gateway_token: None,
            owner_wallet: Default::default(),
            owner_identity: None,
            gatekeeper_network: Default::default(),
            issuing_gatekeeper: Default::default(),
            state: Default::default(),
            expire_time: None,
        }
    }

    #[test]
    fn serialize_data() {
        let token = stub_gateway_token();
        let serialized = borsh::to_vec(&token).unwrap();
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
    fn has_expired() {
        init();
        let mut token = stub_gateway_token();

        token.set_expire_time(now() - 1000);

        assert!(token.has_expired(0));
        assert!(!token.is_valid());
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
