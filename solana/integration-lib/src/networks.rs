use solana_program::pubkey::Pubkey;

/// A cached gatekeeper network for optimizing CPI calls
pub struct GatewayNetwork {
    pub address: Pubkey,
    pub expire_address: (Pubkey, u8),
}

/// The IGNITE network
pub const IGNITE: GatewayNetwork = GatewayNetwork {
    // `ignREusXmGrscGNUesoU9mxfds9AiYTezUKex2PsZV6`
    address: Pubkey::new_from_array([
        10, 173, 203, 200, 162, 28, 105, 73, 70, 177, 164, 71, 227, 99, 161, 76, 204, 121, 56, 243,
        253, 93, 26, 243, 255, 19, 229, 135, 248, 140, 179, 237,
    ]),
    // `DH46SxsYWBMf3Ca1hPMUYyZzQpf9bfAw93ncUKhvZCWA`
    expire_address: (
        Pubkey::new_from_array([
            182, 105, 8, 204, 178, 183, 14, 10, 72, 167, 101, 3, 229, 84, 250, 127, 161, 4, 22,
            124, 101, 23, 20, 164, 214, 211, 180, 155, 99, 97, 58, 119,
        ]),
        255,
    ),
};

/// A list of all cached networks
pub const GATEWAY_NETWORKS: &[GatewayNetwork] = &[IGNITE];
