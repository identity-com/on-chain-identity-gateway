use crate::arguments::{GatekeeperAccount, GatekeeperNetworkAccount};
use crate::pda::GatekeeperSignerSeeder;
use anchor_lang::prelude::*;

pub fn create_gatekeeper(
    authority: Pubkey,
    bump: u8,
    data: CreateGatekeeperData,
    gatekeeper: &mut Account<Gatekeeper>,
    network: &mut Account<GatekeeperNetwork>,
) -> Result<()> {
    if data.auth_keys.is_empty() {
        return Err(error!(GatekeeperErrors::NoAuthKeys));
    }

    if data
        .auth_keys
        .iter()
        .filter(|key| {
            GatekeeperKeyFlags::from_bits_truncate(key.flags).contains(GatekeeperKeyFlags::AUTH)
        })
        .count()
        < data.auth_threshold as usize
    {
        return Err(error!(GatekeeperErrors::InsufficientAuthKeys));
    }

    gatekeeper.auth_threshold = data.auth_threshold;
    gatekeeper.gatekeeper_network = data.gatekeeper_network;
    gatekeeper.addresses = data.addresses;
    gatekeeper.staking_account = data.staking_account;
    gatekeeper.signer_bump = bump;
    gatekeeper.fees = data.fees;
    gatekeeper.auth_keys = data.auth_keys;
}

/// Creates a new gatekeeper
#[derive(Debug)]
pub struct CreateGatekeeper;

impl<AI> Instruction<AI> for CreateGatekeeper {
    type Accounts = CreateGatekeeperAccounts<AI>;
    type Data = CreateGatekeeperData;
    type ReturnType = ();
}

/// Accounts for [`CreateGatekeeper`]
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [<'info> where AI: ToSolanaAccountInfo<'info>])]
#[validate(data = (signer_bump: u8, rent: Rent))]
pub struct CreateGatekeeperAccounts<AI> {
    /// The network for the new gatekeeper
    pub network: GatekeeperNetworkAccount<AI>,
    /// The key with [`NetworkKeyFlags::CREATE_GATEKEEPER`] permission
    #[validate(signer)]
    pub key: AI,
    /// The gatekeeper account to create
    // TODO: Replace with proper gatekeeper account type and init validate
    pub gatekeeper: GatekeeperAccount<AI>,
    /// The system program
    pub system_program: SystemProgram<AI>,
    /// The signer for the new gatekeeper
    #[validate(data = (GatekeeperSignerSeeder{ gatekeeper: *self.gatekeeper.info().key() }, signer_bump))]
    pub gatekeeper_signer: Seeds<AI, GatekeeperSignerSeeder>,
    /// The funder for the new gatekeeper account if needed.
    #[validate(signer(IfSome), writable(IfSome))]
    pub funder: Option<AI>,
}

/// Data for [`CreateGatekeeper`]
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct CreateGatekeeperData {
    /// The [`Gatekeeper::signer_bump`].
    pub signer_bump: u8,
    /// The initial key for the gatekeeper. Allows setting up the gatekeeper.
    pub initial_auth_key: Pubkey,
}

#[cfg(feature = "processor")]
mod processor {
    use super::CreateGatekeeper;
    use cruiser::instruction::{Instruction, InstructionProcessor};
    use cruiser::solana_program::rent::Rent;
    use cruiser::{CruiserResult, Pubkey, ToSolanaAccountInfo};

    impl<'a, AI> InstructionProcessor<AI, CreateGatekeeper> for CreateGatekeeper
    where
        AI: ToSolanaAccountInfo<'a>,
    {
        type FromAccountsData = ();
        type ValidateData = (u8, Rent);
        type InstructionData = ();

        fn data_to_instruction_arg(
            _data: <CreateGatekeeper as Instruction<AI>>::Data,
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
            _accounts: &mut <CreateGatekeeper as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<CreateGatekeeper as Instruction<AI>>::ReturnType> {
            todo!()
        }
    }
}
