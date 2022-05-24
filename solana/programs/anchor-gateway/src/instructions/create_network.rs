use crate::program_files::NetworkAuthKey;
use crate::types::NetworkFees;
use anchor_lang::prelude::*;
use solana_program::clock::UnixTimestamp;
// use cruiser::msg;
// use cruiser::prelude::*;

/// Creates a new network.
// #[derive(Debug)]
// pub struct CreateNetwork;
// impl<AI> Instruction<AI> for CreateNetwork {
//     type Accounts = CreateNetworkAccounts<AI>;
//     type Data = CreateNetworkData;
//     type ReturnType = ();
// }

// / Accounts for [`CreateNetwork`].
// #[derive(AccountArgument, Debug)]
// #[account_argument(account_info = AI, generics = [<'a> where AI: ToSolanaAccountInfo<'a>])]
// #[validate(data = (signer_bump: u8, rent: Rent))]
// pub struct CreateNetworkAccounts<AI> {
//     /// The network to create.
//     #[validate(data = GatewayNetworkCreate{
//         system_program: &self.system_program,
//         rent: Some(rent),
//         funder: self.funder.as_ref(),
//         funder_seeds: None,
//         cpi: CPIChecked,
//     })]
//     pub network: GatekeeperNetworkAccount<AI>,
//     /// The system program
//     pub system_program: SystemProgram<AI>,
//     /// The signer for the network.
//     #[validate(data = (NetworkSignerSeeder{ network: *self.network.info().key() }, signer_bump))]
//     pub network_signer: Seeds<AI, NetworkSignerSeeder>,
//     /// The funder for the network if needed.
//     #[validate(signer(IfSome), writable(IfSome))]
//     pub funder: Option<AI>,
// }
/// Data for [`CreateNetwork`].
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
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
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
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
            msg!("Data: {:#?}", data);
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

            let mut network = accounts.network.write()?;
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
            auth_threshold.set_num(data.auth_threshold);
            pass_expire_time.set_num(data.pass_expire_time);
            network_data_len.set_num(data.network_data_len);
            signer_bump.set_num(data.signer_bump);
            // todo!("Add fees and auth_keys")
            Ok(())
        }
    }
}
#[cfg(feature = "cpi")]
mod cpi {
    use super::*;
    use crate::GatewayInstructions;

    pub struct CreateNetworkCPI<'a, AI> {
        accounts: Vec<MaybeOwned<'a, AI>>,
        data: Option<Vec<u8>>,
    }
    impl<'a, AI> CreateNetworkCPI<'a, AI> {
        #[allow(clippy::needless_pass_by_value)]
        pub fn new_from_zeroed(
            network: impl Into<MaybeOwned<'a, AI>>,
            system_program: impl Into<MaybeOwned<'a, AI>>,
            network_signer: impl Into<MaybeOwned<'a, AI>>,
            instruction_data: CreateNetworkData,
        ) -> CruiserResult<Self> {
            let mut data = Vec::new();
            <GatewayInstructions as InstructionListItem<CreateNetwork>>::discriminant_compressed()
                .serialize(&mut data)?;
            instruction_data.serialize(&mut data)?;
            Ok(Self {
                accounts: vec![network.into(), system_program.into(), network_signer.into()],
                data: Some(data),
            })
        }
    }

    impl<'a, AI> InstructionListCPI for CreateNetworkCPI<'a, AI>
    where
        AI: ToSolanaAccountMeta,
    {
        type InstructionList = GatewayInstructions;
        type Instruction = CreateNetwork;
        type AccountInfo = AI;

        fn instruction(&mut self, program_id: &Pubkey) -> SolanaInstruction {
            SolanaInstruction {
                program_id: *program_id,
                accounts: self
                    .accounts
                    .iter()
                    .map(MaybeOwned::as_ref)
                    .map(AI::to_solana_account_meta)
                    .collect(),
                data: self.data.take().unwrap(),
            }
        }
    }
}

#[cfg(feature = "client")]
pub mod client {
    //! Client functions for [`CreateNetwork`]
    use super::*;
    use crate::instructions::create_network::cpi::CreateNetworkCPI;
    use cruiser::solana_sdk::native_token::LAMPORTS_PER_SOL;
    use std::iter::once;

    /// TODO: Docs
    #[allow(clippy::missing_panics_doc)]
    pub fn create_network<'a>(
        program_id: &Pubkey,
        network: impl Into<HashedSigner<'a>> + 'a,
        funder: impl Into<HashedSigner<'a>> + 'a,
        mut create_data: CreateNetworkData,
    ) -> (
        impl IntoIterator<Item = SolanaInstruction> + 'a,
        impl IntoIterator<Item = HashedSigner<'a>> + 'a,
    ) {
        cruiser::msg!("Creating network");
        let network = network.into();
        let network_key = network.pubkey();
        let (network_signer, signer_bump) = NetworkSignerSeeder {
            network: network_key,
        }
        .find_address(program_id);

        let create_account =
            system_program::create_account(funder, network, LAMPORTS_PER_SOL, 15000, *program_id);

        create_data.signer_bump = signer_bump;
        (
            create_account.0.into_iter().chain(once(
                CreateNetworkCPI::new_from_zeroed(
                    SolanaAccountMeta::new(network_key, true),
                    SolanaAccountMeta::new_readonly(SystemProgram::<()>::KEY, false),
                    SolanaAccountMeta::new_readonly(network_signer, false),
                    create_data,
                )
                .unwrap()
                .instruction(program_id),
            )),
            create_account.1,
        )
    }
}
