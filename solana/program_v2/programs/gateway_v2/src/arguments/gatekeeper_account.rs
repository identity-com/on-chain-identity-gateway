use crate::accounts::Gatekeeper;
use crate::GatewayAccountList;
use cruiser::prelude::*;

/// A [`Gatekeeper`] account
pub type GatekeeperAccount<AI> = InPlaceAccount<AI, GatewayAccountList, Gatekeeper>;
