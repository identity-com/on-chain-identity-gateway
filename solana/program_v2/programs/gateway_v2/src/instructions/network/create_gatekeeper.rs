// use crate::arguments::{GatekeeperAccount, GatekeeperNetworkAccount};
// use crate::pda::GatekeeperSignerSeeder;
use crate::constants::GATEKEEPER_SEED;
use crate::errors::GatekeeperErrors;
use crate::state::gatekeeper::{
    Gatekeeper, GatekeeperAuthKey, GatekeeperFees, GatekeeperKeyFlags, GatekeeperSize,
    GatekeeperState,
};
use anchor_lang::prelude::*;

pub fn create_gatekeeper(
    // need to use authority somewhere?
    // store authority on the gatekeeper struct,
    // need to pass in network account as well to modify it by adding gatekeeper keys
    authority: Pubkey,
    bump: u8,
    data: CreateGatekeeperData,
    gatekeeper: &mut Account<Gatekeeper>,
) -> Result<()> {
    if data.auth_keys.is_empty() {
        return Err(error!(GatekeeperErrors::NoAuthKeys));
    }
    // Checks if there are enough auth keys to create the gatekeeper, should maybe check in NetworkKeyFlags
    if data
        .auth_keys
        .iter()
        .filter(|key| {
            GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(GatekeeperKeyFlags::AUTH)
        })
        .count()
        < data.auth_threshold as usize
    {
        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
    }
    print!("{}", authority);

    gatekeeper.auth_threshold = data.auth_threshold;
    gatekeeper.signer_bump = bump;
    gatekeeper.auth_keys = data.auth_keys;
    gatekeeper.gatekeeper_network = data.gatekeeper_network;
    gatekeeper.addresses = data.addresses;
    gatekeeper.staking_account = data.staking_account;
    gatekeeper.fees = data.fees;
    gatekeeper.gatekeeper_state = GatekeeperState::Active;
    Ok(())
}
/// Data for [`CreateGatekeeper`]
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateGatekeeperData {
    pub auth_threshold: u8,
    /// The [`Gatekeeper::signer_bump`].
    pub signer_bump: u8,
    /// The initial key for the gatekeeper. Allows setting up the gatekeeper.
    pub auth_keys: Vec<GatekeeperAuthKey>,
    /// The associated network for the gatekeeper
    pub gatekeeper_network: Pubkey,
    // addresses of the gatekeeper
    pub addresses: Pubkey,
    // staking account for the gatekeeper
    pub staking_account: Pubkey,
    // Fees for the gatekeeper
    pub fees: Vec<GatekeeperFees>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateGatekeeperData)]
pub struct CreateGatekeeperAccount<'info> {
    #[account(
    init,
    payer = authority,
    space =
    Gatekeeper::on_chain_size_with_arg(
    GatekeeperSize{
    auth_keys: data.auth_keys.len() as u16,
    fees_count: data.fees.len() as u16,
    }
    ),
    seeds = [GATEKEEPER_SEED, authority.key().as_ref(), data.gatekeeper_network.key().as_ref()],
    bump
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
