use anchor_lang::prelude::*;
use crate::account::GatekeeperNetwork;
use crate::{NetworkAuthKey, NetworkKeyFlags, UpdateNetworkData};
use crate::types::GatekeeperKeyFlags;

#[derive(Debug)]
pub struct UpdateNetwork {}

impl UpdateNetwork {
    pub fn process(data: UpdateNetworkData, network: &mut Account<GatekeeperNetwork>, authority: &mut Signer<'info>) -> Result<()> {
        Self::add_auth_keys(&data, network, authority)?;
        Self::set_expire_time(&data, network, authority)?;

        Ok(())
    }

    pub fn add_auth_keys(data: &UpdateNetworkData, network: &mut Account<GatekeeperNetwork>, authority: &mut Signer<'info>) -> Result<()> {
        if data.auth_keys.add.len() == 0 && data.auth_keys.remove.len() == 0 {
            // no auth keys to add/remove
            return Ok(());
        }

        if !Self::can_access(&mut network.auth_keys, authority, NetworkKeyFlags::AUTH) {
            return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
        }

        // remove the keys if they exist
        data.auth_keys.remove.iter().for_each(|key| {
            let index: Option<usize> = network.auth_keys.iter().position(|x| x.key == *key);

            match index {
                Some(x) => {
                    // don't allow removing own key for now (TODO, check if other Auth keys exist)
                    if network.auth_keys[x].key == *authority.key {
                        // TODO: Proper error here
                        msg!("Cannot remove own auth key");
                        panic!()
                    } else {
                        network.auth_keys.remove(x);
                        network.auth_keys_count -= 1;
                    }
                    // return Ok();
                }
                None => {
                    msg!("Cannot remove auth key that doesn't exist");
                    // TODO: Figure out how to error here
                    // return Err(error!(ErrorCode::InsufficientAccessAuthKeys));
                    panic!()
                }
            }
        });

        // either add or update keys
        data.auth_keys.add.iter().for_each(|key| {
            let index: Option<usize> = network.auth_keys.iter().position(|x| x.key == key.key);
            match index {
                Some(x) => {
                    // Don't allow updating the flag and removing AUTH key (TODO: check if other auth keys exist)
                    if network.auth_keys[x].key == *authority.key && !GatekeeperKeyFlags::contains(
                        &GatekeeperKeyFlags::from_bits_truncate(key.flags), GatekeeperKeyFlags::AUTH) {
                        msg!("Not updating flag");
                        // TODO: Proper error here
                        panic!()
                    } else {
                        msg!("Updating flag");
                        // update the key with the new flag if it exists
                        network.auth_keys[x].flags = key.flags;
                    }
                }
                None => {
                    // add the new key
                    network.auth_keys.push(*key);
                    network.auth_keys_count += 1;
                }
            }
        });

        Ok(())
    }

    pub fn set_expire_time(data: &UpdateNetworkData, network: &mut Account<GatekeeperNetwork>, authority: &mut Signer<'info>) -> Result<()> {
        // msg!(":::::: {} | {}" ,data.pass_expire_time, network.pass_expire_time );
        // if data.pass_expire_time == network.pass_expire_time {
        //     // No change
        //     return Ok(());
        // }

        if !Self::can_access(&mut network.auth_keys, authority, NetworkKeyFlags::SET_EXPIRE_TIME) {
            // TODO
            // return Err(error!(ErrorCode::InsufficientAccessExpiry));
        }

        Ok(())
    }

    pub fn can_access(keys: &mut Vec<NetworkAuthKey>, authority: &mut Signer, flag: NetworkKeyFlags) -> bool {
        keys.iter().filter(|key|
            NetworkKeyFlags::from_bits_truncate(key.flags).contains(flag)
                && *authority.key == key.key
        ).count() > 0
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("No auth keys provided")]
    NoAuthKeys,
    #[msg("Not enough auth keys provided")]
    InsufficientAuthKeys,
    #[msg("Insufficient access to update auth keys")]
    InsufficientAccessAuthKeys,
    #[msg("Insufficient access to set expiry time")]
    InsufficientAccessExpiry,
    #[msg("Auth key not found")]
    AuthKeyNotFound,
}

// use crate::accounts::NetworkAuthKey;
// use crate::arguments::GatekeeperNetworkAccount;
// use crate::types::{NetworkFees, NetworkKeyFlags};
// use cruiser::prelude::*;
//
// /// Updates the data of a network
// #[derive(Debug)]
// pub struct UpdateNetwork;
// impl<AI> Instruction<AI> for UpdateNetwork {
//     type Accounts = UpdateNetworkAccounts<AI>;
//     type Data = UpdateNetworkData;
//     type ReturnType = ();
// }
//
// /// Accounts for [`UpdateNetwork`]
// #[derive(AccountArgument, Debug)]
// #[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
// pub struct UpdateNetworkAccounts<AI> {
//     /// The network to update
//     #[validate(writable)]
//     pub network: GatekeeperNetworkAccount<AI>,
//     /// The key with proper permissions to update the network
//     #[validate(signer(all))]
//     pub keys: Rest<AI>,
// }
//
// /// Data for [`UpdateNetwork`]
// #[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub struct UpdateNetworkData {
//     /// Updates [`GatekeeperNetwork::network_features`].
//     /// Requires one of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::SET_FEATURES`].
//     pub network_features: Vec8<FeatureUpdate>,
//     /// Updates [`GatekeeperNetwork::auth_threshold`]. `0` means no change.
//     /// Requires set of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::AUTH`] and meet current [`GatekeeperNetwork::auth_threshold`].
//     pub auth_threshold: u8,
//     /// Updates [`GatekeeperNetwork::pass_expire_time`]. `<=-1` means no change.
//     /// Requires one of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::SET_EXPIRE_TIME`].
//     pub pass_expire_time: UnixTimestamp,
//     /// Updates [`GatekeeperNetwork::max_fee`]. `0` means no change.
//     ///
//     /// ***Very unsafe to set as old passes will not work properly!!!!.***
//     ///
//     /// Requires set of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::AUTH`] and meet current [`GatekeeperNetwork::auth_threshold`].
//     pub network_data_len: u16,
//     /// Updates [`GatekeeperNetwork::fees`].
//     /// Requires one of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::ADD_FEES`], [`NetworkKeyFlags::REMOVE_FEES`], or [`NetworkKeyFlags::ADJUST_FEES`] depending on operation.
//     pub fees: Vec8<UpdateFees>,
//     /// Updates [`GatekeeperNetwork::auth_keys`].
//     /// Requires set of [`UpdateNetworkAccounts::keys`] to have [`NetworkKeyFlags::AUTH`] and meet current [`GatekeeperNetwork::auth_threshold`].
//     pub auth_keys: Vec8<UpdateAuthKeys>,
// }
//
// /// Sets a given fee
// #[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub struct FeatureUpdate {
//     /// The index of feature to update
//     pub feature: u8,
//     /// The value to update the feature to
//     pub value: [u8; 32],
// }
//
// /// Sets a given fee
// #[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub struct FeeSet {
//     /// Index of the fee to set
//     pub index: u16,
//     /// Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).
//     pub issue: u16,
//     /// Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).
//     pub refresh: u16,
//     /// Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).
//     pub expire: u16,
//     /// Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).
//     pub verify: u16,
// }
//
// /// Network fee update
// #[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub enum UpdateFees {
//     /// Adds a new fee
//     Add(NetworkFees),
//     /// Sets a fee
//     Set(FeeSet),
//     /// Removes a fee.
//     /// ***Very unsafe to set as gatekeepers will have to update their fees to remove this one!!!!.***
//     Remove(u16),
// }
//
// /// Sets a given auth key
// #[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub struct AuthKeySet {
//     /// Index of the auth key to set
//     pub index: u16,
//     /// The flags to set
//     pub flags: NetworkKeyFlags,
// }
//
// /// Network auth key update
// #[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
// pub enum UpdateAuthKeys {
//     /// Adds a new auth key
//     Add(NetworkAuthKey),
//     /// Sets an auth key
//     Set(AuthKeySet),
//     /// Removes an auth key. Cannot remove auth keys to get below the auth threshold.
//     Remove(u16),
// }
//
// #[cfg(feature = "processor")]
// mod processor {
//     use crate::instructions::UpdateNetwork;
//     use cruiser::instruction::{Instruction, InstructionProcessor};
//     use cruiser::{AccountInfo, CruiserResult, Pubkey};
//
//     impl<AI> InstructionProcessor<AI, UpdateNetwork> for UpdateNetwork
//     where
//         AI: AccountInfo,
//     {
//         type FromAccountsData = ();
//         type ValidateData = ();
//         type InstructionData = ();
//
//         fn data_to_instruction_arg(
//             _data: <UpdateNetwork as Instruction<AI>>::Data,
//         ) -> CruiserResult<(
//             Self::FromAccountsData,
//             Self::ValidateData,
//             Self::InstructionData,
//         )> {
//             todo!()
//         }
//
//         fn process(
//             _program_id: &Pubkey,
//             _data: Self::InstructionData,
//             _accounts: &mut <UpdateNetwork as Instruction<AI>>::Accounts,
//         ) -> CruiserResult<<UpdateNetwork as Instruction<AI>>::ReturnType> {
//             todo!()
//         }
//     }
// }
