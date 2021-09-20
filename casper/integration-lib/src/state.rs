//! Program state
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

    /// Tests if the gateway token has the required feature
    pub fn has_feature(&self, feature: Feature) -> bool {
        let ordinal = feature as u8;
        if ordinal < 8 {
            // If this fails, the features enum must have grown to >8 elements
            self.features & (1 << ordinal) != 0
        } else {
            false
        }
    }

    /// Checks if this is a "vanilla" token,
    /// ie one that needs no additional account inputs to validate it
    pub fn is_vanilla(&self) -> bool {
        !self.has_feature(Feature::IdentityLinked)
    }

    /// Checks if the gateway token is in a valid state
    /// Note, this does not check ownership or expiry.
    pub fn is_valid_state(&self) -> bool {
        self.state == GatewayTokenState::Active
    }

    /// Checks if a vanilla gateway token is in a valid state
    /// Use is_valid_exotic to validate exotic gateway tokens
    pub fn is_valid(&self) -> bool {
        self.is_vanilla() && self.is_valid_state() && !self.has_expired()
    }

    pub fn has_expired(&self) -> bool {
        self.has_feature(Feature::Expirable) && before_now(self.expire_time.unwrap())
    }

    pub fn set_expire_time(&mut self, expire_time: UnixTimestamp) {
        self.set_feature(Feature::Expirable);
        self.expire_time = Some(expire_time);
    }

    /// Checks if the exotic gateway token is in a valid state (not inactive or expired)
    /// Note, this does not check association to any wallet.
    pub fn is_valid_exotic(&self, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
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
    pub fn owned_by_did(&self, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
        // check if this gateway token is linked to an identity
        if !self.has_feature(Feature::IdentityLinked) {
            return false;
        }

        // check if the passed-in did is the owner of this gateway token
        if *did.key != self.owner_identity.unwrap() {
            return false;
        }

        // check that one of the transaction signers is an authority on the DID
        validate_owner(did, signers).is_ok()
    }

    pub fn is_session_token(&self) -> bool {
        self.parent_gateway_token.is_some()
    }

    // pub fn matches_transaction_details(&self, transaction_details: &dyn CompatibleTransactionDetails) -> bool {
    //     if !self.has_feature(Feature::TransactionLinked) { return false }
    //
    //     self.transaction_details.unwrap().compatible_with(transaction_details)
    // }
}

/// Enum representing the states that a gateway token can be in.
#[derive(Clone, Debug, PartialEq, BorshSerialize, BorshDeserialize, BorshSchema)]
pub enum GatewayTokenState {
    /// Valid, non-frozen token. Note - a token may be active but have passed its expire_time.
    Active,
    /// Temporarily paused token.
    Frozen,
    /// A token that has been revoked by the gatekeeper network.
    Revoked,
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
    use sol_did::state::{SolData, VerificationMethod};
    use solana_program::program_stubs;
    use solana_sdk::signature::{Keypair, Signer};
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
}
