use anchor_lang::prelude::*;

use crate::errors::NetworkErrors;
use crate::state::{AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken};

pub fn create_network(ctx: Context<CreateNetworkAccount>, data: CreateNetworkData) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let authority = &ctx.accounts.authority;

    network.auth_threshold = data.auth_threshold;
    // TODO: Do we even need this dedicated authority if we implement the auth_keys system?
    network.authority = *authority.key;
    network.pass_expire_time = data.pass_expire_time;
    network.auth_keys = data.auth_keys;
    network.fees = data.fees;
    network.supported_tokens = data.supported_tokens;

    Ok(())
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec<NetworkFeesPercentage>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<AuthKey>,
    pub supported_tokens: Vec<SupportedToken>,
}

impl CreateNetworkData {
    fn check_auth_threshold(&self) -> bool {
        let auth_key_count = self.auth_keys
            .iter()
            .filter(|key| {
                NetworkKeyFlags::from_bits_truncate(key.flags).contains(NetworkKeyFlags::AUTH)
            })
            .count();

        auth_key_count >= self.auth_threshold as usize
    }
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetworkAccount<'info> {
    #[account(
    init,
    payer = payer,
    space = GatekeeperNetwork::size(
    data.fees.len(),
    data.auth_keys.len(),
    0,
    data.supported_tokens.len()
    ),
    constraint = data.check_auth_threshold() @ NetworkErrors::InsufficientAuthKeys
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
