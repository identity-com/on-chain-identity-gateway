//! Program state
use {
    crate::id,
    borsh::{BorshDeserialize, BorshSchema, BorshSerialize},
    solana_program::{
        pubkey::Pubkey,
        program_pack::IsInitialized,
        msg,
    },
    std::{
        collections::VecDeque
    },
};

/// Struct wrapping data and providing metadata
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct InboxData {
    /// The public key of the owner of the inbox  
    pub owner: Pubkey,
    /// Thee owner's alias or username
    pub alias: String,
    /// All of the messages in the inbox
    pub messages: Vec<Message>
}

impl InboxData {
    /// Default size of struct
    pub const DEFAULT_SIZE: u8 = 10;

    /// Create a new inbox
    pub fn new(owner: Pubkey) -> Self {
        Self {
            owner,
            alias: "".to_string(),
            messages: Vec::with_capacity(usize::from(InboxData::DEFAULT_SIZE)) // VecDeque::with_capacity(usize::from(InboxData::DEFAULT_SIZE)).into(),
        }
    }

    /// Post a message to the inbox
    pub fn post(&mut self, message: Message) {
        let mut message_deque: VecDeque<Message> = self.messages.clone().into();
        message_deque.push_back(message);
        
        msg!("deque len {}, vec capacity {}", message_deque.len(), usize::from(InboxData::DEFAULT_SIZE) );
        if message_deque.len() > usize::from(InboxData::DEFAULT_SIZE) {
            message_deque.pop_front();
        }
        
        self.messages = message_deque.into()
    }
}

impl IsInitialized for InboxData {
    /// Is initialized
    fn is_initialized(&self) -> bool {
        !self.owner.to_bytes().is_empty()
    }
}


/// The seed string used to derive a program address for a Solarium inbox from an owner account
pub const ADDRESS_SEED: &'static [u8; 8] = br"solarium";

/// Get program-derived inbox address for the authority
pub fn get_inbox_address_with_seed(authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[&authority.to_bytes(), ADDRESS_SEED], &id())
}

/// Struct for the Message object
#[derive(Clone, Debug, Default, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Message {
    /// The block at which the message was received (TODO datatype)
    pub timestamp: u8,
    /// The message sender DID
    pub sender: Pubkey,
    /// The (typically encrypted) message content
    pub content: String,
}

impl Message {
    /// Create a new message
    pub fn new(sender: Pubkey, content: String) -> Self {
        Self {
            timestamp: 0, // TODO
            sender,
            content: content.to_string(),
        }
    }
}


#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::borsh as program_borsh;


}
