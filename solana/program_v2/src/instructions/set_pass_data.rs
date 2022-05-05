use crate::util::{GatekeeperAccount, PassAccount};
use cruiser::account_argument::AccountArgument;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::instruction::Instruction;
use cruiser::types::small_vec::Vec16;
use cruiser::AccountInfo;

/// Sets the data on a pass.
#[derive(Debug)]
pub struct SetPassData;

impl<AI> Instruction<AI> for SetPassData {
    type Accounts = SetPassDataAccounts<AI>;
    type Data = SetPassDataData;
    type ReturnType = ();
}

/// Accounts for [`SetPassData`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct SetPassDataAccounts<AI> {
    /// The gatekeeper for the pass
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The pass to change the data of.
    pub pass: PassAccount<AI>,
    /// The key from the gatekeeper.
    /// Must have [`GatekeeperKeyFlags::SET_PASS_DATA`] permission.
    #[validate(signer)]
    pub key: AI,
}

/// Data for [`SetPassData`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct SetPassDataData {
    /// The network data to update to. If [`None`] will not change.
    pub pass_network_data: Option<Vec16<u8>>,
    /// The gatekeeper data to update to. If [`None`] will not change.
    pub pass_gatekeeper_data: Option<Vec16<u8>>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::SetPassData;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, SetPassData> for SetPassData
    where
        AI: AccountInfo,
    {
        type FromAccountsData = ();
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <SetPassData as Instruction<AI>>::Data,
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
            _accounts: &mut <SetPassData as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<SetPassData as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
