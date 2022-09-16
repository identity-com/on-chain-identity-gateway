use crate::arguments::{GatekeeperAccount, GatekeeperNetworkAccount};
use crate::pda::GatekeeperSignerSeeder;
use anchor_lang::prelude::*;

pub fn create_gatekeeper(
    authority: Pubkey,
    bump: u8,
    data: CreateGatekeeperData,
    gatekeeper: &mut Account<Gatekeeper>,
) -> Result<()> {
    if data.auth_keys.is_empty() {
        return Err(error!(GatekeeperErrors::NoAuthKeys));
    }

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

    gatekeeper.auth_threshold = data.auth_threshold;
    gatekeeper.gatekeeper_network = data.gatekeeper_network;
    gatekeeper.addresses = data.addresses;
    gatekeeper.staking_account = data.staking_account;
    gatekeeper.signer_bump = bump;
    gatekeeper.fees = data.fees;
    gatekeeper.auth_keys = data.auth_keys;
}
/// Data for [`CreateGatekeeper`]
#[derive(Clone, Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateGatekeeperData {
    /// The [`Gatekeeper::signer_bump`].
    pub signer_bump: u8,
    /// The initial key for the gatekeeper. Allows setting up the gatekeeper.
    pub auth_keys: Vec<GatekeeperAuthKey>,
    /// The associated network for the gatekeeper
    pub gatekeeper_network: Pubkey,
    /// The initial state of the gatekeeper
    pub gatekeeper_state: GatekeeperState,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateGatekeeperData)]
pub struct CreateGatekeeperAccount<'info> {
    #[account(
    init,
    payer = authority,
    space = Gatekeeper::on_chain_size_with_arg(
    GatekeeperSize{
    auth_keys: data.auth_keys.len() as u16,
    }
    ),
    seeds = [GATEKEEPER_SEED, authority.key().as_ref()],
    bump
    )]
    pub gatekeeper: Account<'info, Gatekeeper>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
