use anchor_lang::prelude::*;

use crate::errors::NetworkErrors;
use crate::state::{
    AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken,
};

pub fn create_network(ctx: Context<CreateNetworkAccount>, data: CreateNetworkData) -> Result<()> {
    let network = &mut ctx.accounts.network;
    let authority = &mut ctx.accounts.authority;

    data.check_threshold()?;

    network.auth_threshold = data.auth_threshold;
    // TODO: Do we even need this dedicated authority if we implement the auth_keys system?
    network.authority = *authority.key;
    network.pass_expire_time = data.pass_expire_time;
    network.auth_keys = data.auth_keys;
    network.fees = data.fees;
    network.supported_tokens = data.supported_tokens;

    Ok(())
}

pub trait CheckAuthKeys {
    fn check_threshold(&self) -> Result<()>;
}

impl CheckAuthKeys for CreateNetworkData {
    fn check_threshold(&self) -> Result<()> {
        if self.auth_keys.is_empty() {
            return Err(error!(NetworkErrors::NoAuthKeys));
        }

        if self
            .auth_keys
            .iter()
            .filter(|key| {
                NetworkKeyFlags::from_bits_truncate(key.flags).contains(NetworkKeyFlags::AUTH)
            })
            .count()
            < self.auth_threshold as usize
        {
            return Err(error!(NetworkErrors::InsufficientAuthKeys));
        }

        Ok(())
    }
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
    )
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
