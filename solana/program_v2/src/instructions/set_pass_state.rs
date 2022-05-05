use crate::in_place::GatekeeperNetworkAccount;
use crate::util::{GatekeeperAccount, PassAccount};
use crate::PassState;
use cruiser::account_argument::AccountArgument;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::instruction::Instruction;
use cruiser::AccountInfo;

/// Sets the state of a pass
#[derive(Debug)]
pub struct SetPassState;

impl<AI> Instruction<AI> for SetPassState {
    type Accounts = SetPassStateAccounts<AI>;
    type Data = SetPassStateData;
    type ReturnType = ();
}

/// Accounts for [`SetPassState`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct SetPassStateAccounts<AI> {
    /// The gatekeeper for the pass
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The pass to change the state of.
    #[validate(writable)]
    pub pass: PassAccount<AI>,
    /// The key from the gatekeeper.
    /// Must have [`GatekeeperKeyFlags::FREEZE`], [`GatekeeperKeyFlags::UNFREEZE`], [`GatekeeperKeyFlags::REVOKE`], or [`GatekeeperKeyFlags::UNREVOKE_PASS`] permission depending on state.
    #[validate(signer)]
    pub key: AI,
    /// Network accounts if unrevoking
    pub network_agreement: Option<NetworkAndKey<AI>>,
}

/// Network agreement accounts
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct NetworkAndKey<AI> {
    /// The network of the pass
    pub network: GatekeeperNetworkAccount<AI>,
    /// The network key, needs [`NetworkKeyFlags::UNREVOKE_PASS`] permission.
    #[validate(signer)]
    pub key: AI,
}

/// Data for [`SetPassState`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct SetPassStateData {
    /// The new state of the pass.
    pub new_state: PassState,
}

#[cfg(feature = "processor")]
mod processor {
    use super::SetPassState;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, SetPassState> for SetPassState
    where
        AI: AccountInfo,
    {
        type FromAccountsData = ();
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <SetPassState as Instruction<AI>>::Data,
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
            _accounts: &mut <SetPassState as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<SetPassState as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
