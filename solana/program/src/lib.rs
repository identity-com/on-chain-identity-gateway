//! SOL program
#![deny(missing_docs)]

pub mod borsh;
mod entrypoint;
pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;

// Export current SDK types for downstream users building with a different SDK version
pub use solana_program;

solana_program::declare_id!("boxndjnzQZEWbBku3YipL4pchYRc1zi4nNSrFUwawWo");

