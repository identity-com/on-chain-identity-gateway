//! Program state
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    sol_did::validate_owner,
    solana_program::{
        pubkey::Pubkey,
        sysvar::clock::Clock,
        clock::UnixTimestamp,
        account_info::AccountInfo
    }
};

fn before(timestamp: UnixTimestamp, now: &Clock) -> bool {
    now.unix_timestamp > timestamp
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
    pub expiry: Option<UnixTimestamp>,
    // /// Details about the transaction that this token has been issued for (session tokens only)
    // pub transaction_details: Option<dyn CompatibleTransactionDetails>
}
impl GatewayToken {
    /// Tests if the gateway token has the required feature
    pub fn has_feature(&self, feature: Feature) -> bool {
        let ordinal = feature as u8;
        if ordinal < 8 {    // If this fails, the features enum must have grown to >8 elements
            self.features & (1 << ordinal) != 0
        } else {
            false
        }
    }
    
    /// Checks if this is a "vanilla" token,
    /// ie one that needs no additional account inputs to validate it
    pub fn is_vanilla(&self) -> bool {
        !self.has_feature(Feature::IdentityLinked) && !self.has_feature(Feature::Expirable)
    }

    /// Checks if the gateway token is in a valid state
    /// Note, this does not check ownership or expiry.
    pub fn is_valid_state(&self) -> bool {
        self.state == GatewayTokenState::Active
    }

    /// Checks if a vanilla gateway token is in a valid state
    pub fn is_valid_vanilla(&self,) -> bool {
        self.is_vanilla() && self.is_valid_state()
    }

    /// Checks if the exotic gateway token is in a valid state (not inactive or expired)
    /// Note, this does not check association to any wallet.
    pub fn is_valid_exotic(&self, clock: &Clock, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
        // Check the token is active
        if !self.is_valid_state() { return false }

        // Check the token has not expired
        if self.has_feature(Feature::Expirable) && !before(self.expiry.unwrap(), clock) { return false }
        
        // Check that the token is owned by did (if identity-linked)
        if self.has_feature(Feature::IdentityLinked) && !self.owned_by_did(did, signers) { return false }

        true
    }

    /// Checks if the gateway token is owned by the identity, 
    /// and that the identity has signed the transaction
    pub fn owned_by_did(&self, did: &AccountInfo, signers: &[&AccountInfo]) -> bool {
        // check if this gateway token is linked to an identity
        if !self.has_feature(Feature::IdentityLinked) { return false }
        
        // check if the passed-in did is the owner of this gateway token 
        if *did.key != self.owner_identity.unwrap() { return false }
        
        // check that one of the transaction signers is an authority on the DID
        validate_owner(did, signers).is_ok()
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
    /// Valid, non-frozen token. Note - a token may be active but have passed its expiry.
    Active,
    /// Temporarily paused token.
    Frozen,
    /// A token that has been revoked by the gatekeeper network.
    Revoked
}
impl Default for GatewayTokenState {
    fn default() -> Self {
        GatewayTokenState::Active
    }
}

/// Feature flag names. The values are encoded as a bitmap in a gateway token
/// NOTE: There may be only 8 values here, as long as the "features" bitmap is a u8
pub enum Feature {
    /// The token is valid for the current transaction only. Must have its lamport balance set to 0.                                        	|
    Session,
    /// The expiry field must be set and the expiry slot & epoch must not be in the past.
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
    pub token: Option<Pubkey>
}
impl CompatibleTransactionDetails for SimpleTransactionDetails {
    /// The amount and the token must match for these transaction details to be considered compatible
    fn compatible_with(&self, rhs: Self) -> bool {
        self.eq(&rhs)
    }
}