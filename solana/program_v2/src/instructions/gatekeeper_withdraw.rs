use crate::util::GatekeeperAccount;
use crate::{Gatekeeper, GatekeeperSignerSeeder};
use cruiser::account_argument::{AccountArgument, Single};
use cruiser::account_types::rest::Rest;
use cruiser::account_types::seeds::Seeds;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::in_place::{get_properties, GetNum};
use cruiser::instruction::Instruction;
use cruiser::spl::token::{Owner, TokenAccount};
use cruiser::AccountInfo;

/// Withdraws funds from a gatekeeper.
/// TODO: Should halted or frozen gatekeepers be able to withdraw?
#[derive(Debug)]
pub struct GatekeeperWithdraw;

impl<AI> Instruction<AI> for GatekeeperWithdraw {
    type Accounts = GatekeeperWithdrawAccounts<AI>;
    type Data = GatekeeperWithdrawData;
    type ReturnType = ();
}

/// Accounts for [`GatekeeperWithdraw`].
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
#[from(data = (withdraw_sol: bool, withdraw_tokens: bool))]
pub struct GatekeeperWithdrawAccounts<AI> {
    /// The network to withdraw from
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The key on the network. Needs [`GatekeeperKeyFlags::ACCESS_VAULT`] permission.
    pub key: AI,
    /// The gatekeeper's signer
    #[validate(data = (
    GatekeeperSignerSeeder{ gatekeeper: *self.gatekeeper.info().key()},
        get_properties!(&self.gatekeeper.read()?, Gatekeeper{ signer_bump })?.get_num(),
    ))]
    pub signer: Seeds<AI, GatekeeperSignerSeeder>,
    /// Destination if withdrawing sol
    #[from(data = withdraw_sol)]
    pub sol_destination: Option<AI>,
    /// Destination if withdrawing tokens
    #[from(data = withdraw_tokens)]
    pub token_destination: Option<TokenAccount<AI>>,
    /// Accounts to withdraw from
    #[validate(data = (Owner(self.signer.info().key()),))]
    pub withdraw_from: Rest<TokenAccount<AI>>,
}

/// Data for [`GatekeeperWithdraw`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct GatekeeperWithdrawData {
    /// Whether to withdraw sol
    pub withdraw_sol: bool,
    /// Whether to withdraw tokens
    pub withdraw_tokens: bool,
    /// Sol withdraw limit if withdrawing sol
    pub sol_withdraw_limit: Option<u64>,
    /// Token withdraw limit if withdrawing tokens
    pub token_withdraw_limit: Option<u64>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::GatekeeperWithdraw;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::{AccountInfo, CruiserResult, Pubkey};

    impl<AI> InstructionProcessor<AI, GatekeeperWithdraw> for GatekeeperWithdraw
    where
        AI: AccountInfo,
    {
        type FromAccountsData = (bool, bool);
        type ValidateData = ();
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <GatekeeperWithdraw as Instruction<AI>>::Data,
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
            _accounts: &mut <GatekeeperWithdraw as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<GatekeeperWithdraw as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
