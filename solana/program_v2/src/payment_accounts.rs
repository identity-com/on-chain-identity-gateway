//! Accounts for collecting payments.

use crate::in_place::GatekeeperNetworkAccount;
use crate::util::{GatekeeperAccount, Operation};
use crate::{Gatekeeper, GatekeeperNetwork, GatekeeperSignerSeeder, NetworkSignerSeeder, Pubkey};
use cruiser::account_argument::{
    AccountArgument, AccountInfoIterator, FromAccounts, Single, ValidateArgument,
};
use cruiser::impls::option::IfSome;
use cruiser::in_place::{get_properties, GetNum};
use cruiser::pda_seeds::PDASeedSet;
use cruiser::spl::token::{Owner, TokenAccount};
use cruiser::{AccountInfo, CruiserResult, GenericError};

/// The accounts needed for payment
#[derive(Debug)]
pub enum PaymentAccounts<AI> {
    /// No accounts needed
    None,
    /// Payment is in SOL
    SOL(SolPaymentAccounts<AI>),
    /// Payment is in tokens
    Token(TokenPaymentAccounts<AI>),
}

impl<AI> AccountArgument for PaymentAccounts<AI>
where
    AI: AccountInfo,
{
    type AccountInfo = AI;

    fn write_back(self, program_id: &Pubkey) -> CruiserResult<()> {
        match self {
            PaymentAccounts::None => Ok(()),
            PaymentAccounts::SOL(accounts) => accounts.write_back(program_id),
            PaymentAccounts::Token(accounts) => accounts.write_back(program_id),
        }
    }

    fn add_keys(&self, add: impl FnMut(Pubkey) -> CruiserResult<()>) -> CruiserResult<()> {
        match self {
            PaymentAccounts::None => Ok(()),
            PaymentAccounts::SOL(accounts) => accounts.add_keys(add),
            PaymentAccounts::Token(accounts) => accounts.add_keys(add),
        }
    }
}

/// Argument for building payment accounts
#[derive(Debug)]
pub struct PaymentsFrom<'a, AI> {
    /// The operation being conducted
    pub operation: Operation,
    /// The gatekeeper for the pass
    pub gatekeeper: &'a GatekeeperAccount<AI>,
    /// The index of the fee from the gatekeeper
    pub gatekeeper_fee_index: u16,
    /// The network for the pass
    pub network: &'a GatekeeperNetworkAccount<AI>,
    /// The index of the fee from the network
    pub network_fee_index: u16,
}

impl<'a, AI> FromAccounts<PaymentsFrom<'a, AI>> for PaymentAccounts<AI>
where
    AI: AccountInfo,
{
    fn from_accounts(
        program_id: &Pubkey,
        infos: &mut impl AccountInfoIterator<Item = Self::AccountInfo>,
        arg: PaymentsFrom<'a, AI>,
    ) -> CruiserResult<Self> {
        let gatekeeper = arg.gatekeeper.read()?;
        let (gatekeeper_signer_bump, gatekeeper_fees) =
            get_properties!(&gatekeeper, Gatekeeper { signer_bump, fees })?;
        let (gatekeeper_fee_token, gatekeeper_fee): (Option<Pubkey>, u64) =
            arg.operation.get_gatekeeper_fee(
                &gatekeeper_fees
                    .get(arg.gatekeeper_fee_index.into())?
                    .ok_or_else(|| GenericError::Custom {
                        error: "gatekeeper fee index out of bounds".to_string(),
                    })?,
            )?;

        if gatekeeper_fee == 0 {
            return Ok(Self::None);
        }
        let network = arg.network.read()?;
        let (network_signer_bump, network_fees) =
            get_properties!(&network, GatekeeperNetwork { signer_bump, fees })?;
        let (network_fee_token, network_fee): (Option<Pubkey>, u16) = arg
            .operation
            .get_network_fee(&network_fees.get(arg.network_fee_index.into())?.ok_or_else(
                || GenericError::Custom {
                    error: "network fee index out of bounds".to_string(),
                },
            )?)?;

        if gatekeeper_fee_token != network_fee_token {
            return Err(GenericError::Custom {
                error: "gatekeeper fee token does not match network fee token".to_string(),
            }
            .into());
        }

        match gatekeeper_fee_token {
            Some(token_mint) => {
                let owner_wallet = AI::from_accounts(program_id, infos, ())?;
                let payment_account = TokenAccount::<AI>::from_accounts(program_id, infos, ())?;
                let gatekeeper_receiver_account =
                    TokenAccount::<AI>::from_accounts(program_id, infos, ())?;
                let network_receiver_account =
                    Option::<TokenAccount<AI>>::from_accounts(program_id, infos, network_fee != 0)?;

                if payment_account.mint != token_mint {
                    return Err(GenericError::Custom {
                        error: "payment account mint does not match gatekeeper fee token"
                            .to_string(),
                    }
                    .into());
                }
                if gatekeeper_receiver_account.mint != token_mint {
                    return Err(GenericError::Custom {
                        error:
                            "gatekeeper receiver account mint does not match gatekeeper fee token"
                                .to_string(),
                    }
                    .into());
                }

                PDASeedSet::new(
                    GatekeeperSignerSeeder {
                        gatekeeper: *arg.gatekeeper.info().key(),
                    },
                    gatekeeper_signer_bump.get_num(),
                )
                .verify_address(program_id, &gatekeeper_receiver_account.owner)?;

                if let Some(network_receiver_account) = &network_receiver_account {
                    PDASeedSet::new(
                        NetworkSignerSeeder {
                            network: *arg.network.info().key(),
                        },
                        network_signer_bump.get_num(),
                    )
                    .verify_address(program_id, &network_receiver_account.owner)?;

                    if network_receiver_account.mint != token_mint {
                        return Err(GenericError::Custom {
                            error:
                                "network receiver account mint does not match gatekeeper fee token"
                                    .to_string(),
                        }
                        .into());
                    }
                }

                Ok(Self::Token(TokenPaymentAccounts {
                    owner_wallet,
                    payment_account,
                    gatekeeper_receiver_account,
                    network_receiver_account,
                }))
            }
            None => {
                let payment_wallet = AI::from_accounts(program_id, infos, ())?;
                let gatekeeper_receiver_wallet = AI::from_accounts(program_id, infos, ())?;
                let network_receiver_wallet =
                    Option::<AI>::from_accounts(program_id, infos, network_fee != 0)?;

                PDASeedSet::new(
                    GatekeeperSignerSeeder {
                        gatekeeper: *arg.gatekeeper.info().key(),
                    },
                    gatekeeper_signer_bump.get_num(),
                )
                .verify_address(program_id, gatekeeper_receiver_wallet.info().key())?;

                if let Some(network_receiver_wallet) = &network_receiver_wallet {
                    PDASeedSet::new(
                        NetworkSignerSeeder {
                            network: *arg.network.info().key(),
                        },
                        network_signer_bump.get_num(),
                    )
                    .verify_address(program_id, network_receiver_wallet.info().key())?;
                }

                Ok(Self::SOL(SolPaymentAccounts {
                    payment_wallet,
                    gatekeeper_receiver_wallet,
                    network_receiver_wallet,
                }))
            }
        }
    }

    fn accounts_usage_hint(_arg: &PaymentsFrom<'a, AI>) -> (usize, Option<usize>) {
        // TODO: actually do this
        (0, None)
    }
}
impl<AI> ValidateArgument for PaymentAccounts<AI>
where
    AI: AccountInfo,
{
    fn validate(&mut self, program_id: &Pubkey, arg: ()) -> CruiserResult<()> {
        match self {
            PaymentAccounts::None => Ok(()),
            PaymentAccounts::SOL(accounts) => accounts.validate(program_id, arg),
            PaymentAccounts::Token(accounts) => accounts.validate(program_id, arg),
        }
    }
}

/// Payment accounts for a sol payment
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo], no_from)]
pub struct SolPaymentAccounts<AI> {
    /// The wallet that will pay the fee
    #[validate(signer, writable)]
    pub payment_wallet: AI,
    /// The gatekeeper that will receive the fee
    #[validate(writable)]
    pub gatekeeper_receiver_wallet: AI,
    /// The network that will receive the fee
    #[validate(writable(IfSome))]
    pub network_receiver_wallet: Option<AI>,
}

/// Payment accounts for a token payment
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [where AI: AccountInfo], no_from)]
pub struct TokenPaymentAccounts<AI> {
    /// The wallet that is the authority for the payment account
    #[validate(signer)]
    pub owner_wallet: AI,
    /// The account that pays the fee
    #[validate(data = Owner(self.owner_wallet.key()))]
    pub payment_account: TokenAccount<AI>,
    /// The gatekeeper account that receives the fee
    pub gatekeeper_receiver_account: TokenAccount<AI>,
    /// The network account that receives the fee
    pub network_receiver_account: Option<TokenAccount<AI>>,
}
