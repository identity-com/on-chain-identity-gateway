use solana_program::rent::Rent;

/// Argument for creating a gatekeeper network
#[derive(Debug)]

pub struct SystemProgram<AI> {
    /// The system program's [`account info`].
    ///
    /// If `is_signer` or `is_writable` is ever [`true`] you probably just got a big bug bounty from Solana!
    // #[validate(key = &Self::KEY)]
    pub info: AI,
}
pub struct GatewayNetworkCreate<'a, AI, CPI> {
    /// The system program
    pub system_program: &'a SystemProgram<AI>,
    /// The rent, defaults to [`Rent::get`]
    pub rent: Option<Rent>,
    /// The funder of the account
    pub funder: Option<&'a AI>,
    /// The seeds for the funder if pda
    // pub funder_seeds: Option<&'a PDASeedSet<'a>>,
    /// The CPI method to use
    pub cpi: CPI,
}

// / Account argument for [`GatekeeperNetwork`].
// #[derive(Debug, AccountArgument)]
// #[account_argument(account_info = AI, generics = [where AI: AccountInfo])]
// #[validate(data = ())]
// #[validate(id = create, data = (create: GatewayNetworkCreate<'a, AI, CPI>), generics = [<'a, 'b, CPI> where CPI: CPIMethod, AI: ToSolanaAccountInfo<'b>])]
pub struct GatekeeperNetworkAccount(
    // #[validate(id = create, data = CreateInPlace{
//     data: (),
//     system_program: create.system_program,
//     rent: create.rent,
//     funder: create.funder,
//     funder_seeds: create.funder_seeds,
//     cpi: create.cpi,
//     account_seeds: None,
//     space: INITIAL_NETWORK_SPACE,
// })]
// InPlaceAccount<AI, GatewayAccountList, GatekeeperNetwork>,
);
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
