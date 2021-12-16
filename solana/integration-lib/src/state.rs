//! Program state
use crate::networks::GATEWAY_NETWORKS;
use crate::Gateway;
use solana_program::entrypoint::ProgramResult;
use solana_program::program_error::ProgramError;
use std::convert::TryInto;
use std::mem::{size_of, transmute};
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    sol_did::validate_owner,
    solana_program::{
        account_info::AccountInfo,
        clock::UnixTimestamp,
        pubkey::Pubkey,
        sysvar::{clock::Clock, Sysvar},
    },
};

fn before_now(timestamp: UnixTimestamp) -> bool {
    let clock = Clock::get().unwrap();
    clock.unix_timestamp > timestamp
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
    pub parent_gateway_token: Option<Pubkey>,
    /// The public key of the wallet to which this token was assigned  
    pub owner_wallet: Pubkey,
    /// The DID (must be on Solana) of the identity to which the token was assigned
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
    pub fn new_vanilla(
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
}

/// An optimized gateway token to access additional data
pub struct InPlaceGatewayToken<T> {
    data: T,
    has_parent_gateway_token: bool,
    has_owner_identity: bool,
    has_expire_time: bool,
}
impl<T> InPlaceGatewayToken<T> {
    const MIN_FEATURES_OFFSET: usize = 0;
    const MIN_PARENT_GATEWAY_TOKEN_OFFSET: usize = Self::MIN_FEATURES_OFFSET + 1;
    const PARENT_GATEWAY_TOKEN_ADD_OFFSET: usize = 32;
    const MIN_OWNER_WALLET_OFFSET: usize = Self::MIN_PARENT_GATEWAY_TOKEN_OFFSET + 1;
    const MIN_OWNER_IDENTITY_OFFSET: usize = Self::MIN_OWNER_WALLET_OFFSET + 32;
    const OWNER_IDENTITY_ADD_OFFSET: usize = 32;
    const MIN_GATEKEEPER_NETWORK_OFFSET: usize = Self::MIN_OWNER_IDENTITY_OFFSET + 1;
    const MIN_ISSUING_GATEKEEPER_OFFSET: usize = Self::MIN_GATEKEEPER_NETWORK_OFFSET + 32;
    const MIN_STATE_OFFSET: usize = Self::MIN_ISSUING_GATEKEEPER_OFFSET + 32;
    const MIN_EXPIRE_TIME_OFFSET: usize = Self::MIN_STATE_OFFSET + 1;

    pub fn data(self) -> T {
        self.data
    }
}
impl<T> InPlaceGatewayToken<T>
where
    T: AsRef<[u8]>,
{
    pub fn new(data: T) -> Result<Self, ProgramError> {
        let data_ref = data.as_ref();
        let mut additional_offset = 0;
        let has_parent_gateway_token =
            data_ref[Self::MIN_PARENT_GATEWAY_TOKEN_OFFSET + additional_offset] != 0;
        if has_parent_gateway_token {
            additional_offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        let has_owner_identity = data_ref[Self::MIN_OWNER_IDENTITY_OFFSET + additional_offset] != 0;
        if has_owner_identity {
            additional_offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        let has_expire_time = data_ref[Self::MIN_EXPIRE_TIME_OFFSET + additional_offset] != 0;
        Ok(Self {
            data,
            has_parent_gateway_token,
            has_owner_identity,
            has_expire_time,
        })
    }
}
impl<T> GatewayTokenAccess for InPlaceGatewayToken<T>
where
    T: AsRef<[u8]>,
{
    fn features(&self) -> u8 {
        self.data.as_ref()[Self::MIN_FEATURES_OFFSET]
    }

    fn parent_gateway_token(&self) -> Option<&Pubkey> {
        if self.has_parent_gateway_token {
            let bytes = &self.data.as_ref()[Self::MIN_PARENT_GATEWAY_TOKEN_OFFSET + 1..];
            Some(pubkey_ref_from_array((&bytes[..32]).try_into().unwrap()))
        } else {
            None
        }
    }

    fn owner_wallet(&self) -> &Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        let bytes = &self.data.as_ref()[Self::MIN_OWNER_WALLET_OFFSET + offset..][..32];
        pubkey_ref_from_array(bytes.try_into().unwrap())
    }

    fn owner_identity(&self) -> Option<&Pubkey> {
        if self.has_owner_identity {
            let mut offset = 0;
            if self.has_parent_gateway_token {
                offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
            }
            let bytes = &self.data.as_ref()[Self::MIN_OWNER_IDENTITY_OFFSET + 1 + offset..][..32];
            Some(pubkey_ref_from_array(bytes.try_into().unwrap()))
        } else {
            None
        }
    }

    fn gatekeeper_network(&self) -> &Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        let bytes = &self.data.as_ref()[Self::MIN_GATEKEEPER_NETWORK_OFFSET + offset..][..32];
        pubkey_ref_from_array(bytes.try_into().unwrap())
    }

    fn issuing_gatekeeper(&self) -> &Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        let bytes = &self.data.as_ref()[Self::MIN_ISSUING_GATEKEEPER_OFFSET + offset..][..32];
        pubkey_ref_from_array(bytes.try_into().unwrap())
    }

    fn state(&self) -> GatewayTokenState {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        match self.data.as_ref()[Self::MIN_STATE_OFFSET + offset] {
            0 => GatewayTokenState::Active,
            1 => GatewayTokenState::Frozen,
            2 => GatewayTokenState::Revoked,
            x => unreachable!("Invalid byte for `GatewayTokenState`: {}", x),
        }
    }

    fn expire_time(&self) -> Option<UnixTimestamp> {
        if self.has_expire_time {
            let mut offset = 0;
            if self.has_parent_gateway_token {
                offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
            }
            if self.has_owner_identity {
                offset += Self::OWNER_IDENTITY_ADD_OFFSET;
            }
            let bytes = &self.data.as_ref()[Self::MIN_EXPIRE_TIME_OFFSET + 1 + offset..]
                [..size_of::<UnixTimestamp>()];
            Some(UnixTimestamp::from_le_bytes(bytes.try_into().unwrap()))
        } else {
            None
        }
    }
}
impl<T> InPlaceGatewayToken<T>
where
    T: AsMut<[u8]>,
{
    pub fn features_mut(&mut self) -> &mut u8
    where
        T: AsMut<[u8]>,
    {
        &mut self.data.as_mut()[Self::MIN_FEATURES_OFFSET]
    }

    pub fn set_features(&mut self, features: u8) {
        self.data.as_mut()[Self::MIN_FEATURES_OFFSET] = features;
    }

    pub fn parent_gateway_token_mut(&mut self) -> Option<&mut Pubkey> {
        if self.has_parent_gateway_token {
            let bytes = &mut self.data.as_mut()[Self::MIN_PARENT_GATEWAY_TOKEN_OFFSET + 1..][..32];
            Some(pubkey_mut_ref_from_array(bytes.try_into().unwrap()))
        } else {
            None
        }
    }

    pub fn owner_wallet_mut(&mut self) -> &mut Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        let bytes = &mut self.data.as_mut()[Self::MIN_OWNER_WALLET_OFFSET + offset..][..32];
        pubkey_mut_ref_from_array(bytes.try_into().unwrap())
    }

    pub fn owner_identity_mut(&mut self) -> Option<&mut Pubkey> {
        if self.has_owner_identity {
            let mut offset = 0;
            if self.has_parent_gateway_token {
                offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
            }
            let bytes =
                &mut self.data.as_mut()[Self::MIN_OWNER_IDENTITY_OFFSET + 1 + offset..][..32];
            Some(pubkey_mut_ref_from_array(bytes.try_into().unwrap()))
        } else {
            None
        }
    }

    pub fn gatekeeper_network_mut(&mut self) -> &mut Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        let bytes = &mut self.data.as_mut()[Self::MIN_GATEKEEPER_NETWORK_OFFSET + offset..][..32];
        pubkey_mut_ref_from_array(bytes.try_into().unwrap())
    }

    pub fn issuing_gatekeeper_mut(&mut self) -> &mut Pubkey {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        let bytes = &mut self.data.as_mut()[Self::MIN_ISSUING_GATEKEEPER_OFFSET + offset..][..32];
        pubkey_mut_ref_from_array(bytes.try_into().unwrap())
    }

    pub fn set_state(&mut self, state: GatewayTokenState) {
        let mut offset = 0;
        if self.has_parent_gateway_token {
            offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
        }
        if self.has_owner_identity {
            offset += Self::OWNER_IDENTITY_ADD_OFFSET;
        }
        self.data.as_mut()[Self::MIN_STATE_OFFSET + offset] = match state {
            GatewayTokenState::Active => 0,
            GatewayTokenState::Frozen => 1,
            GatewayTokenState::Revoked => 2,
        };
    }

    pub fn set_expire_time(&mut self, expire_time: UnixTimestamp) -> ProgramResult {
        if self.has_expire_time {
            let mut offset = 0;
            if self.has_parent_gateway_token {
                offset += Self::PARENT_GATEWAY_TOKEN_ADD_OFFSET;
            }
            if self.has_owner_identity {
                offset += Self::OWNER_IDENTITY_ADD_OFFSET;
            }
            self.data.as_mut()[Self::MIN_EXPIRE_TIME_OFFSET + 1 + offset..]
                [..size_of::<UnixTimestamp>()]
                .copy_from_slice(&expire_time.to_le_bytes());
            Ok(())
        } else {
            Err(ProgramError::InvalidAccountData)
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
        if ordinal < 8 {
            // If this fails, the features enum must have grown to >8 elements
            self.features() & (1 << ordinal) != 0
        } else {
            false
        }
    }

    /// Checks if this is a "vanilla" token,
    /// ie one that needs no additional account inputs to validate it
    fn is_vanilla(&self) -> bool {
        !self.has_feature(Feature::IdentityLinked)
    }

    /// Checks if the gateway token is in a valid state
    /// Note, this does not check ownership or expiry.
    fn is_valid_state(&self) -> bool {
        self.state() == GatewayTokenState::Active
    }

    /// Checks if a vanilla gateway token is in a valid state
    /// Use is_valid_exotic to validate exotic gateway tokens
    fn is_valid(&self) -> bool {
        self.is_vanilla() && self.is_valid_state() && !self.has_expired()
    }

    fn has_expired(&self) -> bool {
        self.has_feature(Feature::Expirable) && before_now(self.expire_time().unwrap())
    }

    /// Checks if the exotic gateway token is in a valid state (not inactive or expired)
    /// Note, this does not check association to any wallet.
    fn is_valid_exotic(&self, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
        // Check the token is active
        if !self.is_valid_state() {
            return false;
        }

        // Check the token has not expired
        if self.has_expired() {
            return false;
        }

        // Check that the token is owned by did (if identity-linked)
        if self.has_feature(Feature::IdentityLinked) && !self.owned_by_did(did, signers) {
            return false;
        }

        true
    }

    /// Checks if the gateway token is owned by the identity,
    /// and that the identity has signed the transaction
    fn owned_by_did(&self, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
        // check if this gateway token is linked to an identity
        if !self.has_feature(Feature::IdentityLinked) {
            return false;
        }

        // check if the passed-in did is the owner of this gateway token
        if did.key != self.owner_identity().unwrap() {
            return false;
        }

        // check that one of the transaction signers is an authority on the DID
        validate_owner(did, signers).is_ok()
    }

    fn is_session_token(&self) -> bool {
        self.parent_gateway_token().is_some()
    }

    // pub fn matches_transaction_details(&self, transaction_details: &dyn CompatibleTransactionDetails) -> bool {
    //     if !self.has_feature(Feature::TransactionLinked) { return false }
    //
    //     self.transaction_details.unwrap().compatible_with(transaction_details)
    // }
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
pub enum Feature {
    /// The token is valid for the current transaction only. Must have its lamport balance set to 0.
    Session,
    /// The expire_time field must be set and the expire time must not be in the past.
    Expirable,
    /// Expect a transaction-details struct, and check the contents against the details of
    /// the transaction that the token is being used for.
    TransactionLinked,
    /// Expect an owner-identity property, and check that a valid signer account for that identity.
    IdentityLinked,
    /// The following flags are not defined by the protocol, but may be used by gatekeeper networks
    /// to add custom features or restrictions to gateway tokens.
    Custom0,
    Custom1,
    Custom2,
    Custom3,
}

pub trait CompatibleTransactionDetails {
    fn compatible_with(&self, rhs: Self) -> bool;
}

/// A simple struct defining details of a transaction, optionally used for session tokens
/// to restrict access based on details of a transaction
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct SimpleTransactionDetails {
    /// The transaction size (in units based on the token. Assume SOL if no token is provided)
    pub amount: u64,
    /// The spl-token that denominates the transaction (if any)
    pub token: Option<Pubkey>,
}
impl CompatibleTransactionDetails for SimpleTransactionDetails {
    /// The amount and the token must match for these transaction details to be considered compatible
    fn compatible_with(&self, rhs: Self) -> bool {
        self.eq(&rhs)
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use rand::{CryptoRng, Rng, RngCore, SeedableRng};
    use rand_chacha::ChaCha20Rng;
    use sol_did::state::{SolData, VerificationMethod};
    use solana_program::program_stubs;
    use solana_sdk::signature::{Keypair, Signer};
    use std::array::IntoIter;
    use std::iter::FusedIterator;
    use std::{
        cell::RefCell,
        rc::Rc,
        sync::Once,
        time::{SystemTime, UNIX_EPOCH},
    };

    static INIT_TESTS: Once = Once::new();

    // Get the current unix timestamp from SystemTime
    fn now() -> UnixTimestamp {
        let start = SystemTime::now();
        let now = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");

        now.as_secs() as UnixTimestamp
    }

    // Create stubs for anything we need that is provided by the solana runtime
    struct TestSyscallStubs {}
    impl program_stubs::SyscallStubs for TestSyscallStubs {
        // create a stub clock object and set it at the provided address
        fn sol_get_clock_sysvar(&self, var_addr: *mut u8) -> u64 {
            // we only need the unix_timestamp
            let stub_clock = Clock {
                slot: 0,
                epoch_start_timestamp: 0,
                epoch: 0,
                leader_schedule_epoch: 0,
                unix_timestamp: now(),
            };

            // rust magic
            unsafe {
                *(var_addr as *mut _ as *mut Clock) = stub_clock;
            }

            0
        }
    }
    // Inject stubs into the solana program singleton
    fn init() {
        INIT_TESTS.call_once(|| {
            program_stubs::set_syscall_stubs(Box::new(TestSyscallStubs {}));
        });
    }

    fn stub_vanilla_gateway_token() -> GatewayToken {
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

    fn stub_identity(identity_owner: &Keypair) -> SolData {
        let key_id = "default";
        SolData {
            authority: Default::default(),
            version: "".to_string(),
            verification_method: vec![VerificationMethod {
                id: key_id.to_string(),
                verification_type: "".to_string(),
                pubkey: identity_owner.pubkey(),
            }],
            authentication: vec![],
            capability_invocation: vec![key_id.to_string()],
            capability_delegation: vec![],
            key_agreement: vec![],
            assertion_method: vec![],
            service: vec![],
        }
    }

    #[test]
    fn serialize_data() {
        let token = stub_vanilla_gateway_token();
        let serialized = token.try_to_vec().unwrap();
        let deserialized = GatewayToken::try_from_slice(&serialized).unwrap();
        assert_eq!(token, deserialized);
    }

    #[test]
    fn is_inactive() {
        let mut token = stub_vanilla_gateway_token();
        token.state = GatewayTokenState::Revoked;
        assert!(!token.is_valid());

        token.state = GatewayTokenState::Frozen;
        assert!(!token.is_valid());
    }

    #[test]
    fn set_feature() {
        let mut token = stub_vanilla_gateway_token();
        assert!(!token.has_feature(Feature::Expirable));
        token.set_feature(Feature::Expirable);
        assert!(token.has_feature(Feature::Expirable))
    }

    #[test]
    fn has_expired() {
        init();
        let mut token = stub_vanilla_gateway_token();

        token.set_expire_time(now() - 1000);

        assert!(token.has_expired());
        assert!(!token.is_valid());
    }

    // Tests that a gateway token that is owned by a DID can be checked.
    // This test is verbose, mainly because of the AccountInfo object which uses a lot of references.
    #[test]
    fn owned_by_identity() {
        // the address of the DID on-chain
        let did_key: Pubkey = Pubkey::new_from_array([100; 32]);
        // a key held by the holder of the DID
        let identity_owner: Keypair = Keypair::new();

        // create the DID and serialise it
        let identity = stub_identity(&identity_owner);
        let mut serialized_identity = identity.try_to_vec().unwrap();

        // create an AccountInfo object referencing the DID
        let mut did_lamports = 0;
        let did_account_info = AccountInfo {
            key: &did_key,
            is_signer: false,
            is_writable: false,
            lamports: Rc::new(RefCell::new(&mut did_lamports)),
            data: Rc::new(RefCell::new(&mut serialized_identity)),
            owner: &sol_did::id(),
            executable: false,
            rent_epoch: 0,
        };

        // create an AccountInfo object referencing the identity owner
        let mut signer_lamports = 0;
        let signer_account_info = AccountInfo {
            key: &identity_owner.pubkey(),
            is_signer: true,
            is_writable: false,
            lamports: Rc::new(RefCell::new(&mut signer_lamports)),
            data: Rc::new(RefCell::new(&mut [])),
            owner: &Default::default(),
            executable: false,
            rent_epoch: 0,
        };

        // create a gateway token linked to the DID
        let mut token = stub_vanilla_gateway_token();
        token.set_feature(Feature::IdentityLinked);
        token.owner_identity = Some(*did_account_info.key);

        // verify that the token is owned by the DID and that the signer account is a valid
        // signer of the DID
        assert!(token.owned_by_did(&did_account_info, &[&signer_account_info]));

        // verify that the token can be used in this transaction, as a signature from
        // a valid signer of the linked identity has been provided.
        assert!(token.is_valid_exotic(&did_account_info, &[&signer_account_info]))
    }

    #[test]
    fn in_place_test() {
        let mut rng = ChaCha20Rng::from_entropy();
        IntoIter::new([true, false])
            .into_iter()
            .compound(IntoIter::new([true, false]))
            .compound(IntoIter::new([true, false]))
            .compound(GatewayTokenState::ALL_STATES)
            .compound(GatewayTokenState::ALL_STATES)
            .for_each(
                |((((has_parent, has_owner_identity), has_expire_time), &state), &to_state)| {
                    let token = new_token(
                        &mut rng,
                        has_parent,
                        has_owner_identity,
                        has_expire_time,
                        state,
                    );

                    let mut token_data =
                        BorshSerialize::try_to_vec(&token).expect("Could not serialize");
                    let in_place =
                        InPlaceGatewayToken::new(&token_data).expect("Could not create in place");
                    assert_eq!(in_place.features(), token.features);
                    assert_eq!(
                        in_place.parent_gateway_token(),
                        token.parent_gateway_token.as_ref()
                    );
                    assert_eq!(in_place.owner_wallet(), &token.owner_wallet);
                    assert_eq!(in_place.owner_identity(), token.owner_identity.as_ref());
                    assert_eq!(in_place.gatekeeper_network(), &token.gatekeeper_network);
                    assert_eq!(in_place.issuing_gatekeeper(), &token.issuing_gatekeeper);
                    assert_eq!(in_place.state(), token.state);
                    assert_eq!(in_place.expire_time(), token.expire_time);
                    let after = BorshDeserialize::try_from_slice(&token_data)
                        .expect("Could not deserialize");
                    assert_eq!(token, after);

                    let mut in_place = InPlaceGatewayToken::new(&mut token_data)
                        .expect("Could not create in place mut");
                    assert_eq!(in_place.features_mut(), &token.features);
                    assert_eq!(
                        in_place.parent_gateway_token_mut(),
                        token.parent_gateway_token.clone().as_mut()
                    );
                    assert_eq!(in_place.owner_wallet_mut(), &token.owner_wallet);
                    assert_eq!(
                        in_place.owner_identity_mut(),
                        token.owner_identity.clone().as_mut()
                    );
                    assert_eq!(in_place.gatekeeper_network_mut(), &token.gatekeeper_network);
                    assert_eq!(in_place.issuing_gatekeeper_mut(), &token.issuing_gatekeeper);
                    let after = BorshDeserialize::try_from_slice(&token_data)
                        .expect("Could not deserialize");
                    assert_eq!(token, after);

                    let token = new_token(
                        &mut rng,
                        has_parent,
                        has_owner_identity,
                        has_expire_time,
                        to_state,
                    );

                    let mut in_place = InPlaceGatewayToken::new(&mut token_data)
                        .expect("Could not create in place mut");
                    in_place.set_features(token.features);
                    assert_eq!(in_place.features(), token.features);
                    assert_eq!(in_place.features_mut(), &token.features);
                    if has_parent {
                        *in_place.parent_gateway_token_mut().unwrap() =
                            token.parent_gateway_token.unwrap();
                    }
                    assert_eq!(
                        in_place.parent_gateway_token(),
                        token.parent_gateway_token.as_ref()
                    );
                    assert_eq!(
                        in_place.parent_gateway_token_mut(),
                        token.parent_gateway_token.clone().as_mut()
                    );
                    *in_place.owner_wallet_mut() = token.owner_wallet;
                    assert_eq!(in_place.owner_wallet(), &token.owner_wallet);
                    assert_eq!(in_place.owner_wallet_mut(), &token.owner_wallet);
                    if has_owner_identity {
                        *in_place.owner_identity_mut().unwrap() = token.owner_identity.unwrap();
                    }
                    assert_eq!(in_place.owner_identity(), token.owner_identity.as_ref());
                    assert_eq!(
                        in_place.owner_identity_mut(),
                        token.owner_identity.clone().as_mut()
                    );
                    *in_place.gatekeeper_network_mut() = token.gatekeeper_network;
                    assert_eq!(in_place.gatekeeper_network(), &token.gatekeeper_network);
                    assert_eq!(in_place.gatekeeper_network_mut(), &token.gatekeeper_network);
                    *in_place.issuing_gatekeeper_mut() = token.issuing_gatekeeper;
                    assert_eq!(in_place.issuing_gatekeeper(), &token.issuing_gatekeeper);
                    assert_eq!(in_place.issuing_gatekeeper_mut(), &token.issuing_gatekeeper);
                    in_place.set_state(token.state);
                    assert_eq!(in_place.state(), token.state);
                    if has_expire_time {
                        in_place
                            .set_expire_time(token.expire_time.unwrap())
                            .expect("Could not set expire time");
                    }
                    assert_eq!(in_place.expire_time(), token.expire_time);

                    assert_eq!(in_place.features_mut(), &token.features);
                    assert_eq!(
                        in_place.parent_gateway_token_mut(),
                        token.parent_gateway_token.clone().as_mut()
                    );
                    assert_eq!(in_place.owner_wallet_mut(), &token.owner_wallet);
                    assert_eq!(
                        in_place.owner_identity_mut(),
                        token.owner_identity.clone().as_mut()
                    );
                    assert_eq!(in_place.gatekeeper_network_mut(), &token.gatekeeper_network);
                    assert_eq!(in_place.issuing_gatekeeper_mut(), &token.issuing_gatekeeper);
                    assert_eq!(in_place.features(), token.features);
                    assert_eq!(
                        in_place.parent_gateway_token(),
                        token.parent_gateway_token.as_ref()
                    );
                    assert_eq!(in_place.owner_wallet(), &token.owner_wallet);
                    assert_eq!(in_place.owner_identity(), token.owner_identity.as_ref());
                    assert_eq!(in_place.gatekeeper_network(), &token.gatekeeper_network);
                    assert_eq!(in_place.issuing_gatekeeper(), &token.issuing_gatekeeper);
                    assert_eq!(in_place.state(), token.state);
                    assert_eq!(in_place.expire_time(), token.expire_time);
                    let after = BorshDeserialize::try_from_slice(&token_data)
                        .expect("Could not deserialize");
                    assert_eq!(token, after);
                },
            );
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
