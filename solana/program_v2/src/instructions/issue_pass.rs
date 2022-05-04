use crate::in_place::GatekeeperNetworkAccount;
use crate::payment_accounts::{PaymentAccounts, PaymentsFrom};
use crate::util::{GatekeeperAccount, Operation, PassAccount};
use cruiser::account_argument::AccountArgument;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::impls::option::IfSome;
use cruiser::instruction::Instruction;
use cruiser::types::small_vec::Vec16;
use cruiser::AccountInfo;

/// Issue a pass to the given account.
#[derive(Debug)]
pub struct IssuePass;

impl<AI> Instruction<AI> for IssuePass {
    type Accounts = IssuePassAccounts<AI>;
    type Data = IssuePassData;
    type ReturnType = ();
}

/// Accounts for [`IssuePass`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[from(data = (gatekeeper_fee_index: u16, network_fee_index: u16))]
pub struct IssuePassAccounts<AI> {
    /// The network for the pass
    pub network: GatekeeperNetworkAccount<AI>,
    /// The gatekeeper for the pass
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The pass to issue.
    /// TODO: Use a dedicated account type for this and use verify init.
    pub new_pass: PassAccount<AI>,
    /// The key from the gatekeeper.
    /// Must have [`GatekeeperKeyFlags::ISSUE`] permission.
    #[validate(signer)]
    pub key: AI,
    /// Accounts handling payment
    #[from(data = PaymentsFrom{
        operation: Operation::Issue,
        gatekeeper: &gatekeeper,
        gatekeeper_fee_index,
        network: &network,
        network_fee_index,
    })]
    pub payment_accounts: PaymentAccounts<AI>,
    /// The funder for the new pass if needed.
    #[validate(signer(IfSome))]
    pub funder: Option<AI>,
}

/// Data for [`IssuePass`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct IssuePassData {
    /// The index of the gatekeeper fee
    pub gatekeeper_fee_index: u16,
    /// The index of the network fee
    pub network_fee_index: u16,
    /// The pass's network data.
    /// If not the same length as the network's data length will be truncated or zero-filled.
    pub pass_network_data: Vec16<u8>,
    /// Extra data added by the gatekeeper.
    /// Before realloc is enabled this lock the length of this pass.
    pub pass_gatekeeper_data: Vec16<u8>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::IssuePass;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, IssuePass> for IssuePass
    where
        AI: AccountInfo,
    {
        type FromAccountsData = (u16, u16);
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <IssuePass as Instruction<AI>>::Data,
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
            _accounts: &mut <IssuePass as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<IssuePass as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
