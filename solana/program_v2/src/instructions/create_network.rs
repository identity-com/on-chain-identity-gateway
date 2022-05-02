use crate::in_place::{GatewayNetworkAccount, GatewayNetworkCreate};
use crate::{GatekeeperNetwork, NetworkFees, NetworkKeyFlags, NetworkSignerSeeder, Pubkey};
use cruiser::account_argument::{AccountArgument, Single};
use cruiser::account_types::seeds::Seeds;
use cruiser::account_types::system_program::SystemProgram;
use cruiser::borsh::{self, BorshDeserialize, BorshSerialize};
use cruiser::in_place::SetNum;
use cruiser::instruction::{Instruction, InstructionProcessor};
use cruiser::solana_program::rent::Rent;
use cruiser::ToSolanaAccountInfo;
use cruiser::{CPIChecked, UnixTimestamp};

/// Creates a new network.
#[derive(Debug)]
pub struct CreateNetwork;
impl<AI> Instruction<AI> for CreateNetwork {
    type Accounts = CreateNetworkAccounts<AI>;
    type Data = CreateNetworkData;
    type ReturnType = ();
}

/// Accounts for [`CreateNetwork`].
#[derive(AccountArgument, Debug)]
#[account_argument(account_info = AI, generics = [<'a> where AI: ToSolanaAccountInfo<'a>])]
#[validate(data = (signer_bump: u8, rent: Rent))]
pub struct CreateNetworkAccounts<AI> {
    #[validate(data = GatewayNetworkCreate{
        system_program: &self.system_program,
        rent: Some(rent),
        funder: &self.funder,
        funder_seeds: None,
        cpi: CPIChecked,
    })]
    network: GatewayNetworkAccount<AI>,
    system_program: SystemProgram<AI>,
    funder: AI,
    #[validate(data = (NetworkSignerSeeder{ network: *self.network.info().key()}, signer_bump))]
    network_signer: Seeds<AI, NetworkSignerSeeder>,
}
/// Data for [`CreateNetwork`].
#[derive(Debug, BorshSerialize, BorshDeserialize)]
pub struct CreateNetworkData {
    auth_threshold: u8,
    pass_expire_time: UnixTimestamp,
    network_data_len: u16,
    signer_bump: u8,
    fees: Vec<NetworkFees>,
    auth_keys: Vec<(NetworkKeyFlags, Pubkey)>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::*;
    use crate::instructions::CreateNetwork;
    use cruiser::account_argument::Single;
    use cruiser::in_place::{get_properties_mut, InPlaceUnitWrite};
    use cruiser::solana_program::sysvar::Sysvar;
    use cruiser::{CruiserResult, GenericError};

    impl<'a, AI> InstructionProcessor<AI, CreateNetwork> for CreateNetwork
    where
        AI: ToSolanaAccountInfo<'a>,
    {
        type FromAccountsData = ();
        type ValidateData = (u8, Rent);
        type InstructionData = (<CreateNetwork as Instruction<AI>>::Data, Rent);

        fn data_to_instruction_arg(
            data: <CreateNetwork as Instruction<AI>>::Data,
        ) -> CruiserResult<(
            Self::FromAccountsData,
            Self::ValidateData,
            Self::InstructionData,
        )> {
            let rent = Rent::get()?;
            Ok(((), (data.signer_bump, rent), (data, rent)))
        }

        fn process(
            _program_id: &Pubkey,
            data: Self::InstructionData,
            accounts: &mut <CreateNetwork as Instruction<AI>>::Accounts,
        ) -> CruiserResult<<CreateNetwork as Instruction<AI>>::ReturnType> {
            let (data, _rent) = data;

            if data.auth_keys.is_empty() {
                return Err(GenericError::Custom {
                    error: "No auth keys provided".to_string(),
                }
                .into());
            }
            if data
                .auth_keys
                .iter()
                .filter(|(flag, _)| flag.contains(NetworkKeyFlags::AUTH))
                .count()
                < data.auth_threshold as usize
            {
                return Err(GenericError::Custom {
                    error: "Not enough auth keys provided".to_string(),
                }
                .into());
            }

            let mut network = GatekeeperNetwork::write(accounts.network.info().data_mut())?;
            let (mut auth_threshold, mut pass_expire_time, mut network_data_len, mut signer_bump) =
                get_properties_mut!(
                    &mut network,
                    GatekeeperNetwork {
                        auth_threshold,
                        pass_expire_time,
                        network_data_len,
                        signer_bump,
                    }
                )?;
            auth_threshold.set_num(1);
            pass_expire_time.set_num(data.pass_expire_time);
            network_data_len.set_num(data.network_data_len);
            signer_bump.set_num(data.signer_bump);
            todo!("Add fees and auth_keys")
        }
    }
}
