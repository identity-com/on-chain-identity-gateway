use crate::in_place::GatekeeperNetworkAccount;
use crate::payment_accounts::{PaymentAccounts, PaymentsFrom};
use crate::util::{GatekeeperAccount, Operation, PassAccount};
use crate::UnixTimestamp;
use cruiser::account_argument::AccountArgument;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::instruction::Instruction;
use cruiser::types::small_vec::{Vec16, Vec8};
use cruiser::AccountInfo;

/// Verifies a pass with optional expiry.
#[derive(Debug)]
pub struct VerifyPass;

impl<AI> Instruction<AI> for VerifyPass {
    type Accounts = VerifyPassAccounts<AI>;
    type Data = VerifyPassData;
    type ReturnType = Vec8<VerifyReturn>;
}

/// Accounts for [`VerifyPass`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[from(data = (expire: bool, gatekeeper_fee_index: u16, network_fee_index: u16))]
pub struct VerifyPassAccounts<AI> {
    /// The network for the pass
    pub network: GatekeeperNetworkAccount<AI>,
    /// The gatekeeper for the pass
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The pass to be refreshed
    pub pass: PassAccount<AI>,
    /// Pass owner in case of user expiry
    #[from(data = expire)]
    pub owner: Option<AI>,
    /// Accounts handling payments
    #[from(data = PaymentsFrom{
        operation: if expire { Operation::Expire } else { Operation::Verify },
        gatekeeper: &gatekeeper,
        gatekeeper_fee_index,
        network: &network,
        network_fee_index,
    })]
    pub payment_accounts: PaymentAccounts<AI>,
}

/// Data for [`VerifyPass`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct VerifyPassData {
    /// The index of gatekeeper fee to use
    pub gatekeeper_fee_index: u16,
    /// The index of network fee to use
    pub network_fee_index: u16,
    /// Whether to expire the pass. Requires the network to have user expiry enabled.
    pub expire: bool,
    /// Requested return values
    pub return_requests: Vec8<VerifyReturnRequest>,
}

/// Return for [`VerifyPass`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub enum VerifyReturn {
    /// The time this pass was issued/refreshed last
    IssueTime(UnixTimestamp),
    /// The time this pass expires
    ExpiryTime(UnixTimestamp),
    /// Network data from the pass
    NetworkData(Vec16<u8>),
    /// Gatekeeper data from the pass
    GatekeeperData(Vec16<u8>),
}

/// Requested returns from [`VerifyPass`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub enum VerifyReturnRequest {
    /// The time this pass was issued/refreshed last
    IssueTime,
    /// The time this pass expires
    ExpiryTime,
    /// Network data from the pass
    NetworkData {
        /// Data start index, inclusive
        start: u16,
        /// Data end index, exclusive
        end: u16,
    },
    /// Gatekeeper data from the pass
    GatekeeperData {
        /// Data start index, inclusive
        start: u16,
        /// Data end index, exclusive
        end: u16,
    },
}

#[cfg(feature = "processor")]
mod processor {
    use super::VerifyPass;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, VerifyPass> for VerifyPass
    where
        AI: AccountInfo,
    {
        type FromAccountsData = (bool, u16, u16);
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <VerifyPass as Instruction<AI>>::Data,
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
            _accounts: &mut <VerifyPass as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<VerifyPass as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
