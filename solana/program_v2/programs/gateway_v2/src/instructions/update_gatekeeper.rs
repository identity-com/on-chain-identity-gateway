use crate::accounts::GatekeeperAuthKey;
use crate::arguments::{GatekeeperAccount, GatekeeperNetworkAccount};
use crate::types::{GatekeeperFees, GatekeeperKeyFlags};
use cruiser::prelude::*;

/// Updates a gatekeeper
#[derive(Debug)]
pub struct UpdateGatekeeper;

impl<AI> Instruction<AI> for UpdateGatekeeper {
    type Accounts = UpdateGatekeeperAccounts<AI>;
    type Data = UpdateGatekeeperData;
    type ReturnType = ();
}

/// Accounts for [`UpdateGatekeeper`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct UpdateGatekeeperAccounts<AI> {
    /// The gatekeeper account
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The network for the gatekeeper
    pub network: GatekeeperNetworkAccount<AI>,
    /// The keys for updating the gatekeeper
    #[validate(signer(all))]
    pub keys: Rest<AI>,
}

/// Data for [`UpdateGatekeeper`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct UpdateGatekeeperData {
    /// The [`Gatekeeper::auth_threshold`]. `0` means no change.
    /// Requires set of [`UpdateGatekeeperAccounts::keys`] to have [`GatekeeperKeyFlags::AUTH`] and meet current [`Gatekeeper::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`Gatekeeper::addresses`]. [`None`] means no change.
    /// Requires one of [`UpdateGatekeeperAccounts::keys`] to have [`GatekeeperKeyFlags::SET_ADDRESSES`].
    /// Currently not supported and will error on [`Some`].
    pub addresses: Option<Pubkey>,
    /// The [`Gatekeeper::staking_account`]. [`None`] means no change.
    /// Currently not supported and will error on [`Some`].
    pub staking_account: Option<Pubkey>,
    /// The [`Gatekeeper::fees`].
    /// Requires one of [`UpdateGatekeeperAccounts::keys`] to have [`GatekeeperKeyFlags::ADD_FEES`], [`GatekeeperKeyFlags::REMOVE_FEES`], or [`GatekeeperKeyFlags::ADJUST_FEES`] depending on operation.
    pub fees: Vec8<UpdateFees>,
    /// The [`Gatekeeper::auth_keys`].
    /// Requires set of [`UpdateGatekeeperAccounts::keys`] to have [`GatekeeperKeyFlags::AUTH`] and meet current [`Gatekeeper::auth_threshold`].
    pub auth_keys: Vec8<UpdateAuthKeys>,
}

/// Sets a given fee
#[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct FeeSet {
    /// Index of the fee to set
    pub index: u16,
    /// Fees taken at issuance of a new pass in token units or lamports for SOL.
    pub issue: u64,
    /// Fees taken when a pass is refreshed in token units or lamports for SOL.
    pub refresh: u64,
    /// The fee taken when a pass is expired in token units or lamports for SOL.
    /// This should only be used where pass value comes from one-time use.
    pub expire: u64,
    /// The fee taken when a pass is verified in token units or lamports for SOL.
    /// This should only be used where pass value comes from proper use
    pub verify: u64,
}

/// Gatekeeper fee update
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub enum UpdateFees {
    Add(GatekeeperFees),
    Set(FeeSet),
    Remove(u16),
}

/// Sets a given auth key
#[derive(Copy, Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct AuthKeySet {
    /// Index of the auth key to set
    pub index: u16,
    /// The flags to set
    pub flags: GatekeeperKeyFlags,
}

/// Gatekeeper auth key update
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub enum UpdateAuthKeys {
    /// Adds a new auth key
    Add(GatekeeperAuthKey),
    /// Sets an auth key
    Set(AuthKeySet),
    /// Removes an auth key. Cannot remove auth keys to get below the auth threshold.
    Remove(u16),
}

#[cfg(feature = "processor")]
mod processor {
    use super::UpdateGatekeeper;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, UpdateGatekeeper> for UpdateGatekeeper
    where
        AI: AccountInfo,
    {
        type FromAccountsData = ();
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <UpdateGatekeeper as Instruction<AI>>::Data,
        ) -> CruiserResult<(
            Self::FromAccountsData,
            Self::ValidateData,
            Self::InstructionData,
        )> {
            todo!()
        }

        fn process(
            _program_id: &Pubkey,
            _data: Self::InstructionData,
            _accounts: &mut <UpdateGatekeeper as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<UpdateGatekeeper as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
