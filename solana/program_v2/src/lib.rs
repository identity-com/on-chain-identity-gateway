#![feature(const_trait_impl)]
#![feature(const_option)]
#![feature(const_option_ext)]
#![feature(const_mut_refs)]
#![feature(const_ptr_offset)]
#![feature(generic_associated_types)]

//! The gateway v2 program from Identity.com

// Solana is on 1.59 currently, this requires the now deprecated where clause position
#![cfg_attr(VERSION_GREATER_THAN_59, allow(deprecated_where_clause_location))]
#![cfg_attr(not(VERSION_GREATER_THAN_59), feature(const_fn_trait_bound))]
#![cfg_attr(all(doc, CHANNEL_NIGHTLY), feature(doc_auto_cfg))]
#![warn(
    unused_import_braces,
    unused_imports,
    missing_docs,
    missing_debug_implementations,
    clippy::pedantic
)]
#![allow(
    clippy::cast_possible_truncation,
    clippy::module_name_repetitions,
    clippy::missing_errors_doc,
    clippy::too_many_lines,
    clippy::mut_mut,
    clippy::wildcard_imports
)]

extern crate core;
pub mod accounts;
pub mod arguments;
pub mod instructions;
pub mod pda;
pub mod types;
pub mod util;

use crate::accounts::{Gatekeeper, GatekeeperNetwork, Pass};
use cruiser::account_list::AccountList;
use cruiser::instruction_list::InstructionList;
use cruiser::{entrypoint_list, ToSolanaAccountInfo};
use std::num::NonZeroU8;

entrypoint_list!(GatewayInstructions, GatewayInstructions);

/// Instructions for the gateway v2 program
#[derive(InstructionList, Copy, Clone, Debug)]
#[instruction_list(account_list = GatewayAccountList, account_info = [<'a, AI> AI where AI: ToSolanaAccountInfo<'a>])]
pub enum GatewayInstructions {
    /// Creates a new network.
    #[instruction(instruction_type = instructions::CreateNetwork)]
    CreateNetwork,
    /// Updates a network.
    #[instruction(instruction_type = instructions::UpdateNetwork)]
    UpdateNetwork,
    /// Closes a network.
    /// TODO: Do we need this?
    #[instruction(instruction_type = instructions::CloseNetwork)]
    CloseNetwork,
    /// Creates a new gatekeeper
    #[instruction(instruction_type = instructions::CreateGatekeeper)]
    CreateGatekeeper,
    /// Updates a gatekeeper's data.
    #[instruction(instruction_type = instructions::UpdateGatekeeper)]
    UpdateGatekeeper,
    //TODO: Do we need a close gatekeeper instruction?
    /// Sets the state of a gatekeeper
    #[instruction(instruction_type = instructions::SetGatekeeperState)]
    SetGatekeeperState,
    /// Issues a pass from a gatekeeper
    #[instruction(instruction_type = instructions::IssuePass)]
    IssuePass,
    /// Refreshes a pass from a gatekeeper
    #[instruction(instruction_type = instructions::RefreshPass)]
    RefreshPass,
    /// Verifies a pass from a gatekeeper
    #[instruction(instruction_type = instructions::VerifyPass)]
    VerifyPass,
    /// Sets a given pass's state
    #[instruction(instruction_type = instructions::SetPassState)]
    SetPassState,
    /// Sets a given pass's data
    #[instruction(instruction_type = instructions::SetPassData)]
    SetPassData,
    /// Withdraws funds from a network
    #[instruction(instruction_type = instructions::NetworkWithdraw)]
    NetworkWithdraw,
    /// Withdraws funds from a gatekeeper
    #[instruction(instruction_type = instructions::GatekeeperWithdraw)]
    GatekeeperWithdraw,
}

/// Accounts for the gateway v2 program
#[allow(clippy::large_enum_variant)]
#[derive(AccountList, Debug)]
#[account_list(discriminant_type = NonZeroU8)]
pub enum GatewayAccountList {
    /// A network which manages many [`Gatekeepers`].
    GatekeeperNetwork(GatekeeperNetwork),
    /// A gatekeeper who can issue [`Pass`]es and is manged by a [`GatekeeperNetwork`].
    Gatekeeper(Gatekeeper),
    /// A pass issued by a [`Gatekeeper`] to a user.
    Pass(Pass),
}
