use crate::in_place::GatekeeperNetworkAccount;
use crate::util::TokenAccountOrWallet;
use cruiser::account_argument::AccountArgument;
use cruiser::account_types::rest::Rest;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::instruction::Instruction;
use cruiser::spl::token::TokenAccount;
use cruiser::AccountInfo;

/// Withdraws funds from a network
#[derive(Debug)]
pub struct NetworkWithdraw;

impl<AI> Instruction<AI> for NetworkWithdraw {
    type Accounts = NetworkWithdrawAccounts<AI>;
    type Data = NetworkWithdrawData;
    type ReturnType = ();
}

/// Accounts for [`NetworkWithdraw`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[from(data = (withdraw_sol: bool, withdraw_tokens: bool))]
pub struct NetworkWithdrawAccounts<AI> {
    /// The network to withdraw from
    pub network: GatekeeperNetworkAccount<AI>,
    /// The key on the network. Needs [`NetworkKeyFlags::ACCESS_VAULT`] permission.
    pub key: AI,
    /// Destination if withdrawing sol
    #[from(data = withdraw_sol)]
    pub sol_destination: Option<AI>,
    /// Destination if withdrawing tokens
    #[from(data = withdraw_tokens)]
    pub token_destination: Option<TokenAccount<AI>>,
    /// Accounts to withdraw from
    pub withdraw_from: Rest<TokenAccountOrWallet<AI>>,
}

/// Data for [`NetworkWithdraw`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct NetworkWithdrawData {
    withdraw_sol: bool,
    withdraw_tokens: bool,
    sol_withdraw_limit: Option<u64>,
    token_withdraw_limit: Option<u64>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::NetworkWithdraw;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, NetworkWithdraw> for NetworkWithdraw
    where
        AI: AccountInfo,
    {
        type FromAccountsData = (bool, bool);
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <NetworkWithdraw as Instruction<AI>>::Data,
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
            _accounts: &mut <NetworkWithdraw as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<NetworkWithdraw as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
