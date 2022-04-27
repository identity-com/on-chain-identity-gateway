use cruiser::instruction::Instruction;
use cruiser::account_argument::AccountArgument;
use crate::in_place::GatewayNetworkAccount;
use cruiser::ToSolanaAccountInfo;

/// Adds fees to a network
#[derive(Debug)]
pub struct AddNetworkFees;
impl<AI> Instruction<AI> for AddNetworkFees {
    type Accounts = AddNetworkFeesAccounts<AI>;
    type Data = ();
    type ReturnType = ();
}

#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [<'a> where AI: ToSolanaAccountInfo<'a>])]
pub struct AddNetworkFeesAccounts<AI> {
    network: GatewayNetworkAccount<AI>,
    #[validate(signer)]
    key: AI,
}
