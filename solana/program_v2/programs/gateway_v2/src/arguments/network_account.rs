use crate::account::*;
use crate::account::{GatekeeperNetwork, NetworkAuthKey};
use crate::types::NetworkFees;
use anchor_lang::prelude::*;

const NETWORK_SEED: &[u8; 10] = b"gk-network";

#[derive(Accounts, Debug)]
#[instruction(data: UpdateNetworkData)]
pub struct UpdateNetworkAccount<'info> {
    #[account(
        mut,
        realloc = GatekeeperNetwork::on_chain_size_with_arg(
            GatekeeperNetworkSize{
                fees_count: (network.fees.len() + data.fees.add.len() - data.fees.remove.len()) as u16,
                auth_keys: (network.auth_keys.len() + data.auth_keys.add.len() - data.auth_keys.remove.len()) as u16,
            }
        ),
        realloc::payer = authority,
        realloc::zero = false,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Debug)]
#[instruction(data: CreateNetworkData)]
pub struct CreateNetworkAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = GatekeeperNetwork::on_chain_size_with_arg(
            GatekeeperNetworkSize{
                fees_count: data.fees.len() as u16,
                auth_keys: data.auth_keys.len() as u16,
            }
        ),
        seeds = [NETWORK_SEED, authority.key().as_ref()],
        bump
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Debug)]
pub struct CloseNetworkAccount<'info> {
    // TODO: Add constraint check (authority in auth keys ??)
    #[account(
        mut,
        close = destination,
        seeds = [NETWORK_SEED, network.initial_authority.key().as_ref()],
        bump = network.signer_bump,
    )]
    pub network: Account<'info, GatekeeperNetwork>,
    /// CHECK: Rent destination account does not need to satisfy the any constraints.
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// /// Data for [`CreateNetwork`].
#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct CreateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: i64,
    /// The [`GatekeeperNetwork::fees`].
    pub fees: Vec<NetworkFees>,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: Vec<NetworkAuthKey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateFees {
    pub add: Vec<NetworkFees>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateKeys {
    pub add: Vec<NetworkAuthKey>,
    pub remove: Vec<Pubkey>,
}

#[derive(Debug, AnchorSerialize, AnchorDeserialize)]
pub struct UpdateNetworkData {
    /// The [`GatekeeperNetwork::auth_threshold`].
    pub auth_threshold: u8,
    /// The [`GatekeeperNetwork::pass_expire_time`].
    pub pass_expire_time: Option<i64>,
    /// The [`GatekeeperNetwork::signer_bump`].
    pub fees: UpdateFees,
    /// The [`GatekeeperNetwork::auth_keys`].
    pub auth_keys: UpdateKeys,
}

// use crate::accounts::GatekeeperNetwork;
// use crate::GatewayAccountList;
// use cruiser::prelude::*;
// use cruiser::solana_program::rent::Rent;

// const INITIAL_NETWORK_SPACE: usize =
//     cruiser::solana_program::entrypoint::MAX_PERMITTED_DATA_INCREASE;

// /// Argument for creating a gatekeeper network
// #[derive(Debug)]
// pub struct GatewayNetworkCreate<'a, AI, CPI> {
//     /// The system program
//     pub system_program: &'a SystemProgram<AI>,
//     /// The rent, defaults to [`Rent::get`]
//     pub rent: Option<Rent>,
//     /// The funder of the account
//     pub funder: Option<&'a AI>,
//     /// The seeds for the funder if pda
//     pub funder_seeds: Option<&'a PDASeedSet<'a>>,
//     /// The CPI method to use
//     pub cpi: CPI,
// }

// /// Account argument for [`GatekeeperNetwork`].
// #[derive(Debug, AccountArgument)]
// #[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
// #[validate(data = ())]
// #[validate(id = create, data = (create: GatewayNetworkCreate<'a, AI, CPI>), generics = [<'a, 'b, CPI> where CPI: CPIMethod, AI: ToSolanaAccountInfo<'b>])]
// pub struct GatekeeperNetworkAccount<AI>(
//     #[validate(id = create, data = CreateInPlace{
//         data: (),
//         system_program: create.system_program,
//         rent: create.rent,
//         funder: create.funder,
//         funder_seeds: create.funder_seeds,
//         cpi: create.cpi,
//         account_seeds: None,
//         space: INITIAL_NETWORK_SPACE,
//     })]
//     InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>,
// );
// impl<AI> Deref for GatekeeperNetworkAccount<AI> {
//     type Target = InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>;

//     fn deref(&self) -> &Self::Target {
//         &self.0
//     }
// }
// impl<AI> DerefMut for GatekeeperNetworkAccount<AI> {
//     fn deref_mut(&mut self) -> &mut Self::Target {
//         &mut self.0
//     }
// }
// impl<AI, Arg> MultiIndexable<Arg> for GatekeeperNetworkAccount<AI>
// where
//     AI: AccountInfo,
//     InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>: MultiIndexable<Arg>,
// {
//     fn index_is_signer(&self, indexer: Arg) -> CruiserResult<bool> {
//         self.0.index_is_signer(indexer)
//     }

//     fn index_is_writable(&self, indexer: Arg) -> CruiserResult<bool> {
//         self.0.index_is_writable(indexer)
//     }

//     fn index_is_owner(&self, owner: &Pubkey, indexer: Arg) -> CruiserResult<bool> {
//         self.0.index_is_owner(owner, indexer)
//     }
// }
// impl<AI, Arg> SingleIndexable<Arg> for GatekeeperNetworkAccount<AI>
// where
//     AI: AccountInfo,
//     InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>:
//         SingleIndexable<Arg, AccountInfo = AI>,
// {
//     fn index_info(&self, indexer: Arg) -> CruiserResult<&Self::AccountInfo> {
//         self.0.index_info(indexer)
//     }
// }
