use crate::in_place::GatekeeperNetworkAccount;
use crate::util::GatekeeperAccount;
use crate::GatekeeperState;
use cruiser::account_argument::AccountArgument;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::instruction::Instruction;
use cruiser::AccountInfo;

/// Sets the state of a gatekeeper.
#[derive(Debug)]
pub struct SetGatekeeperState;

impl<AI> Instruction<AI> for SetGatekeeperState {
    type Accounts = SetGatekeeperStateAccounts<AI>;
    type Data = SetGatekeeperStateData;
    type ReturnType = ();
}

/// Accounts for [`SetGatekeeperState`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
pub struct SetGatekeeperStateAccounts<AI> {
    /// The network for the gatekeeper.
    pub network: GatekeeperNetworkAccount<AI>,
    /// The gatekeeper to set the state of.
    #[validate(writable)]
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The key from the network with [`NetworkKeyFlags::FREEZE_GATEKEEPER`],
    /// [`NetworkKeyFlags::UNFREEZE_GATEKEEPER`], [`NetworkKeyFlags::HALT_GATEKEEPER`], or
    /// [`NetworkKeyFlags::UNHALT_GATEKEEPER`] permission depending on the state change.
    #[validate(signer)]
    pub key: AI,
}

/// Data for [`SetGatekeeperState`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct SetGatekeeperStateData {
    /// The new state of the gatekeeper.
    pub state: GatekeeperState,
}

#[cfg(feature = "processor")]
mod processor {
    use super::SetGatekeeperState;
    use crate::instructions::SetGatekeeperStateData;
    use crate::Gatekeeper;
    use cruiser::in_place::get_properties_mut;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, SetGatekeeperState> for SetGatekeeperState
    where
        AI: AccountInfo,
    {
        type FromAccountsData = ();
        type ValidateData = ();
        type InstructionData = SetGatekeeperStateData;

        fn data_to_instruction_arg(
            data: <SetGatekeeperState as Instruction<AI>>::Data,
        ) -> CruiserResult<(
            Self::FromAccountsData,
            Self::ValidateData,
            Self::InstructionData,
        )> {
            Ok(((), (), data))
        }

        fn process(
            _program_id: &Pubkey,
            data: Self::InstructionData,
            accounts: &mut <SetGatekeeperState as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<SetGatekeeperState as Instruction<AI>>::ReturnType> {
            let mut gatekeeper = accounts.gatekeeper.write()?;
            let mut state = get_properties_mut!(&mut gatekeeper, Gatekeeper { gatekeeper_state })?;
            state.set_state(data.state);
            todo!("Verify key and network is valid")
        }
    }
}
