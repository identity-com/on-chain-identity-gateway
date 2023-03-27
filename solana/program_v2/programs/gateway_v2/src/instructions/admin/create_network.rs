use anchor_lang::prelude::*;

use crate::errors::NetworkErrors;
use crate::state::{
    AuthKey, GatekeeperNetwork, NetworkFeesPercentage, NetworkKeyFlags, SupportedToken,
};

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
    network.network_features = data.network_features;

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
    /// The [`GatekeeperNetwork::supported_tokens`].
    pub supported_tokens: Vec<SupportedToken>,
    /// The [`GatekeeperNetwork::network_features`].
    pub network_features: u32,
}

impl CreateNetworkData {
    fn check_auth_threshold(&self) -> bool {
        let auth_key_count = self
            .auth_keys
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
    constraint = data.check_auth_threshold() @ NetworkErrors::InsufficientAuthKeys,
    constraint = crate::util::validate_fees_within_bounds(&data.fees) @ NetworkErrors::NetworkFeeOutOfBounds
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[cfg(test)]
mod tests {
    use crate::instructions::admin::CreateNetworkData;
    use crate::state::{AuthKey, NetworkKeyFlags};

    #[test]
    fn test_check_auth_threshold() {
        let mut data = CreateNetworkData {
            auth_threshold: 2,
            pass_expire_time: 0,
            fees: Vec::new(),
            auth_keys: Vec::new(),
            supported_tokens: Vec::new(),
            network_features: 0,
        };

        // Test case where there are fewer auth keys than the threshold
        data.auth_keys.push(AuthKey {
            flags: NetworkKeyFlags::AUTH.bits(),
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
        });
        assert!(!data.check_auth_threshold());

        // Test case where there are exactly as many auth keys as the threshold
        data.auth_keys.push(AuthKey {
            flags: NetworkKeyFlags::AUTH.bits(),
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
        });
        assert!(data.check_auth_threshold());

        // Test case where there are more auth keys than the threshold
        data.auth_keys.push(AuthKey {
            flags: NetworkKeyFlags::AUTH.bits(),
            key: "wLYV8imcPhPDZ3JJvUgSWv2p6PNz4RfFtvdqn4esJGX"
                .parse()
                .unwrap(),
        });
        assert!(data.check_auth_threshold());
    }
}
