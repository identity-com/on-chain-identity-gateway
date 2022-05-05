use crate::accounts::{GatekeeperNetwork, NetworkAuthKey};
use crate::arguments::{GatekeeperNetworkAccount, GatewayNetworkCreate};
use crate::pda::NetworkSignerSeeder;
use crate::types::{NetworkFees, NetworkKeyFlags};
use cruiser::prelude::*;

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
    /// The network to create.
    #[validate(data = GatewayNetworkCreate{
        system_program: &self.system_program,
        rent: Some(rent),
        funder: self.funder.as_ref(),
        funder_seeds: None,
        cpi: CPIChecked,
    })]
    pub network: GatekeeperNetworkAccount<AI>,
    /// The system program
    pub system_program: SystemProgram<AI>,
    /// The signer for the network.
    #[validate(data = (NetworkSignerSeeder{ network: *self.network.info().key()}, signer_bump))]
    pub network_signer: Seeds<AI, NetworkSignerSeeder>,
    /// The funder for the network if needed.
    #[validate(signer(IfSome), writable(IfSome))]
    pub funder: Option<AI>,
}
/// Data for [`CreateNetwork`].
#[derive(Debug, BorshSerialize, BorshDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: UnixTimestamp,
    /// The [`GatekeeperNetwork::network_data_len`].
    pub network_data_len: u16,
    /// The [`GatekeeperNetwork::signer_bump`].
    pub signer_bump: u8,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec8<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec8<NetworkAuthKey>,
}

#[cfg(feature = "processor")]
mod processor {
    use super::*;
    use crate::instructions::CreateNetwork;

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
                .filter(|key| key.flags.contains(NetworkKeyFlags::AUTH))
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
