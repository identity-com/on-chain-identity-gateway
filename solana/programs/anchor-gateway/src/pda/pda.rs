use anchor_lang::prelude::*;

/// The [`NetworkSignerSeeder`]'s static seed.
pub const NETWORK_SIGNER_SEED: &str = "network";
/// The [`GatekeeperSignerSeeder`]'s static seed.
pub const GATEKEEPER_SIGNER_SEED: &str = "gatekeeper";

/// Seeder for the network signer
#[derive(Debug)]
pub struct NetworkSignerSeeder {
    /// The network the signer is for
    pub network: Pubkey,
}
// TODO: PDASeeder and PDASeed not recognized
// impl PDASeeder for NetworkSignerSeeder {
//     fn seeds<'a>(&'a self) -> Box<dyn Iterator<Item = &'a dyn PDASeed> + 'a> {
//         Box::new([&NETWORK_SIGNER_SEED as &dyn PDASeed, &self.network].into_iter())
//     }
// }

/// Seeder for the gatekeeper signer
#[derive(Debug)]
pub struct GatekeeperSignerSeeder {
    /// The gatekeeper the signer is for
    pub gatekeeper: Pubkey,
}
// TODO: PDASeeder and PDASeed not recognized
// impl PDASeeder for GatekeeperSignerSeeder {
//     fn seeds<'a>(&'a self) -> Box<dyn Iterator<Item = &'a dyn PDASeed> + 'a> {
//         Box::new([&GATEKEEPER_SIGNER_SEED as &dyn PDASeed, &self.gatekeeper].into_iter())
//     }
// }
