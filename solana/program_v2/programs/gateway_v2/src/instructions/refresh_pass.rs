use crate::arguments::{
    GatekeeperAccount, GatekeeperNetworkAccount, PassAccount, PaymentAccounts, PaymentsFrom,
};
use crate::types::Operation;
use cruiser::prelude::*;

/// Refreshes a pass
#[derive(Debug)]
pub struct RefreshPass;

impl<AI> Instruction<AI> for RefreshPass {
    type Accounts = RefreshPassAccounts<AI>;
    type Data = RefreshPassData;
    type ReturnType = ();
}

/// Accounts for [`RefreshPass`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[from(data = (gatekeeper_fee_index: u16, network_fee_index: u16))]
pub struct RefreshPassAccounts<AI> {
    /// The network for the pass
    pub network: GatekeeperNetworkAccount<AI>,
    /// The gatekeeper for the pass
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The pass to be refreshed
    #[validate(writable)]
    pub pass: PassAccount<AI>,
    /// Accounts handling payments
    #[from(data = PaymentsFrom{
        operation: Operation::Refresh,
        gatekeeper: &gatekeeper,
        gatekeeper_fee_index,
        network: &network,
        network_fee_index,
    })]
    pub payment_accounts: PaymentAccounts<AI>,
}

/// Data for [`RefreshPass`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct RefreshPassData {
    /// The index of gatekeeper fee to use
    pub gatekeeper_fee_index: u16,
    /// The index of network fee to use
    pub network_fee_index: u16,
    /// The network data to update to. If [`None`] will not change.
    pub pass_network_data: Option<Vec16<u8>>,
    /// The gatekeeper data to update to. If [`None`] will not change.
    pub pass_gatekeeper_data: Option<Vec16<u8>>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::RefreshPass;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, RefreshPass> for RefreshPass
    where
        AI: AccountInfo,
    {
        type FromAccountsData = (u16, u16);
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <RefreshPass as Instruction<AI>>::Data,
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
            _accounts: &mut <RefreshPass as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<RefreshPass as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
