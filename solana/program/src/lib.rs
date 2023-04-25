//! SOL program
#![deny(missing_docs)]

extern crate core;

mod entrypoint;
pub mod processor;

// Export current SDK types for downstream users building with a different SDK version
pub use solana_program;
