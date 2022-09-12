use crate::state::{GatekeeperNetwork, GatekeeperNetworkSize};
use crate::types::{GatekeeperKeyFlags, NetworkFees};
use crate::{NetworkAuthKey, NetworkKeyFlags};
use crate::constants::NETWORK_SEED;
use anchor_lang::prelude::*;

pub fn update_network(
    data: &UpdateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
    authority: &mut Signer,
) -> Result<()> {
    set_expire_time(data, network, authority)?;
    add_auth_keys(data, network, authority)?;
    add_fees(data, network, authority)?;
    Ok(())
}
pub fn add_auth_keys(
    data: &UpdateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
    authority: &mut Signer,
) -> Result<()> {
    // MARTIN: This case is not required, correct?
    if data.auth_keys.add.is_empty() && data.auth_keys.remove.is_empty() {
        // no auth keys to add/remove
        return Ok(());
    }

    if !can_access(&mut network.auth_keys, authority, NetworkKeyFlags::AUTH) {
        return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
    }

    // remove the keys if they exist
    for key in data.auth_keys.remove.iter() {
        let index: Option<usize> = network.auth_keys.iter().position(|x| x.key == *key);

        if index.is_none() {
            return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
        }

        let key_index = index.unwrap();
        if network.auth_keys[key_index].key == *authority.key {
            // Cannot remove own key (TODO?)
            return Err(error!(ErrorCode::InvalidKey));
        }

        network.auth_keys.remove(key_index);
    }

    for key in data.auth_keys.add.iter() {
        let index: Option<usize> = network.auth_keys.iter().position(|x| x.key == key.key);

        if index.is_none() {
            // add the key ifr it doesn't exist
            network.auth_keys.push(*key);
        } else {
            let key_index = index.unwrap();

            // Don't allow updating the flag and removing AUTH key (TODO: check if other auth keys exist)
            if network.auth_keys[key_index].key == *authority.key
                && !GatekeeperKeyFlags::contains(
                    &GatekeeperKeyFlags::from_bits_truncate(key.flags),
                    GatekeeperKeyFlags::AUTH,
                )
            {
                return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
            }

            // update the key with the new flag if it exists
            network.auth_keys[key_index].flags = key.flags;
        }
    }

    Ok(())
}
pub fn add_fees(
    data: &UpdateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
    authority: &mut Signer,
) -> Result<()> {
    // MARTIN: This case is not required, correct?
    if data.fees.add.is_empty() && data.fees.remove.is_empty() {
        // no fees to add/remove
        return Ok(());
    }

    if !can_access(&mut network.auth_keys, authority, NetworkKeyFlags::AUTH) {
        return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
    }

    // remove the fees if they exist
    for fee in data.fees.remove.iter() {
        let index: Option<usize> = network.fees.iter().position(|x| x.token == *fee);

        if index.is_none() {
            return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
        }
        // TODO: Don't think we need this because removal of fees is okay? Could be wrong
        let fee_index = index.unwrap();
        // if network.fees[key_index].key == *authority.key {
        //     // Cannot remove own key (TODO?)
        //     return Err(error!(ErrorCode::InvalidKey));
        // }

        network.fees.remove(fee_index);
    }

    for fee in data.fees.add.iter() {
        let index: Option<usize> = network.fees.iter().position(|x| x.token == fee.token);

        if index.is_none() {
            // add the fee if it doesn't exist
            network.fees.push(*fee);
        } else {
            let fee_index = index.unwrap();

            // TODO: Don't think this block is necessary but not 100% certain
            // Don't allow updating the flag and removing AUTH key (TODO: check if other auth keys exist)
            // if network.auth_keys[key_index].key == *authority.key
            //     && !GatekeeperKeyFlags::contains(
            //         &GatekeeperKeyFlags::from_bits_truncate(key.flags),
            //         GatekeeperKeyFlags::AUTH,
            //     )
            // {
            //     return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
            // }

            // update the existing key with new fees
            network.fees[fee_index] = *fee;
        }
    }

    Ok(())
}

pub fn set_expire_time(
    data: &UpdateNetworkData,
    network: &mut Account<GatekeeperNetwork>,
    authority: &mut Signer,
) -> Result<()> {
    match data.pass_expire_time {
        Some(pass_expire_time) => {
            if pass_expire_time != network.pass_expire_time {
                if !can_access(
                    &mut network.auth_keys,
                    authority,
                    NetworkKeyFlags::SET_EXPIRE_TIME,
                ) {
                    return Err(error!(ErrorCode::InsufficientAccessExpiry));
                }

                network.pass_expire_time = pass_expire_time;
            }

            Ok(())
        }
        None => Ok(()),
    }
}
pub fn can_access(
    keys: &mut [NetworkAuthKey],
    authority: &mut Signer,
    flag: NetworkKeyFlags,
) -> bool {
    keys.iter()
        .filter(|key| {
            NetworkKeyFlags::from_bits_truncate(key.flags).contains(flag)
                && *authority.key == key.key
        })
        .count()
        > 0
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: Option<i64>,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: UpdateFees,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: UpdateKeys,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateFees {
    pub add: Vec<NetworkFees>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateKeys {
    pub add: Vec<NetworkAuthKey>,
    pub remove: Vec<Pubkey>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No auth keys provided")]
    NoAuthKeys,
    #[msg("Not enough auth keys provided")]
    InsufficientAuthKeys,
    #[msg("Invalid key provided")]
    InvalidKey,
    #[msg("Insufficient access to update auth keys")]
    InsufficientAccessAuthKeys,
    #[msg("Insufficient access to set expiry time")]
    InsufficientAccessExpiry,
    #[msg("Auth key not found")]
    AuthKeyNotFound,
}

#[derive(Accounts, Debug)]
#[instruction(data: UpdateNetworkData)]
pub struct UpdateNetworkAccount<'info> {
    #[account(
        mut,
        realloc = GatekeeperNetwork::on_chain_size_with_arg(
            GatekeeperNetworkSize{
                fees_count: (network.fees.len() + data.fees.add.len() - data.fees.remove.len()) as u16,
                auth_keys: (network.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len()) as u16,
            }
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}