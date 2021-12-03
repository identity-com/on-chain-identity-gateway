//! SOL program
#![deny(missing_docs)]

mod entrypoint;
pub mod error;
pub mod processor;
pub mod state;

// Export current SDK types for downstream users building with a different SDK version
pub use solana_program;

solana_program::declare_id!("gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs");
