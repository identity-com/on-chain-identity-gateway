//! Program state
use {
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey
    }
};

/// Defines the gateway token structure
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct GatewayToken {
    /// Feature flags that define the type of gateway token
    pub features: u8,
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
    /// The expiry time of the token ([epoch, slot]) (expirable tokens only)
    pub expiry: Option<[u64;2]>,
    /// Details about the transaction that this token has been issued for (session tokens only)
    pub transaction_details: Option<TransactionDetails>
}
impl GatewayToken {
    pub fn has_feature(&self, feature: Feature) -> bool {
        let ordinal = feature as u8;
        if ordinal < 8 {    // If this fails, the features enum must have grown to >8 elements
            self.features & (1 << ordinal) != 0
        } else {
            false
        }
    }
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

/// A simple struct defining details of a transaction, optionally used for session tokens
/// to restrict access based on details of a transaction
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct TransactionDetails {
    /// The transaction size (in units based on the token. Assume SOL if no token is provided)
    pub amount: u64,
    /// The spl-token that denominates the transaction (if any)
    pub token: Option<Pubkey>
}