use crate::arguments::GatekeeperNetworkAccount;
use cruiser::prelude::*;

/// Closes a [`GatekeeperNetwork`]
#[derive(Debug)]
pub struct CloseNetwork;
impl<AI> Instruction<AI> for CloseNetwork {
    type Accounts = CloseNetworkAccounts<AI>;
    type Data = CloseNetworkData;
    type ReturnType = ();
}

/// Accounts for [`CloseNetwork`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct CloseNetworkAccounts<AI> {
    /// The network to close
    pub network: CloseAccount<AI, GatekeeperNetworkAccount<AI>>,
    /// Where the funds go to
    pub to: AI,
    /// Requires set to have [`NetworkKeyFlags::AUTH`] and meet current [`GatekeeperNetwork::auth_threshold`].
    #[validate(signer(all))]
    pub keys: Rest<AI>,
}
/// Data for [`CloseNetwork`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct CloseNetworkData {}

#[cfg(feature = "processor")]
mod processor {
    use crate::instructions::CloseNetwork;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, CloseNetwork> for CloseNetwork
    where
        AI: AccountInfo,
    {
        type FromAccountsData = ();
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <CloseNetwork as Instruction<AI>>::Data,
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
            accounts: &mut <CloseNetwork as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<CloseNetwork as Instruction<AI>>::ReturnType> {
            // Check keys are valid auth for network
            accounts.network.set_fundee(accounts.to.clone());
            todo!()
        }
    }
}
