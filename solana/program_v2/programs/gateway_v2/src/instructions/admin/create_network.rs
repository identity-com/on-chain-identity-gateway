use crate::errors::NetworkErrors;
use crate::state::{
    GatekeeperNetwork, NetworkAuthKey, NetworkFees, NetworkKeyFlags, SupportedToken,
};
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

pub fn create_network(ctx: Context<CreateNetworkAccount>, data: CreateNetworkData) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let authority = &mut ctx.accounts.authority;

    // Check there are auth_keys provided (TODO: Is this necessary? The next check implies this)
    if data.auth_keys.is_empty() {
        return Err(error!(NetworkErrors::NoAuthKeys));
    }

    // Check if there are enough auth_keys with the AUTH flag set
    if data
        .auth_keys
        .iter()
        .filter(|key| {
            NetworkKeyFlags::from_bits_truncate(key.flags).contains(NetworkKeyFlags::AUTH)
        })
        .count()
        < data.auth_threshold as usize
    {
        return Err(error!(NetworkErrors::InsufficientAuthKeys));
    }

    network.auth_threshold = data.auth_threshold;
    network.authority = *authority.key;
    network.pass_expire_time = data.pass_expire_time;
    network.auth_keys = data.auth_keys;
    network.fees = data.fees;

    Ok(())
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
    pub supported_tokens: Vec<SupportedToken>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetworkAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = GatekeeperNetwork::size(
            data.fees.len(),
            data.auth_keys.len(),
            0,
            data.supported_tokens.len()
        )
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
