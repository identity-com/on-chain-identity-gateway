use crate::accounts::Pass;
use crate::GatewayAccountList;
use cruiser::prelude::*;

/// A [`Pass`] account
pub type PassAccount<AI> = InPlaceAccount<AI, GatewayAccountList, Pass>;
