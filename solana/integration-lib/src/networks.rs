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
pub const TIBER: GatewayNetwork = GatewayNetwork {
    // `tibePmPaoTgrs929rWpu755EXaxC7M3SthVCf6GzjZt`
    address: Pubkey::new_from_array([
        13, 63, 167, 207, 48, 68, 126, 44, 126, 102, 37, 62, 157, 146, 5, 221, 217, 42, 146, 19,
        218, 21, 229, 113, 98, 60, 113, 237, 225, 104, 243, 83,
    ]),
    // `BNkYz4VZFuNaLey1hF1GCjFfN1p11trYouGPKqwH7ioJ`
    expire_address: (
        Pubkey::new_from_array([
            154, 39, 79, 94, 27, 40, 214, 85, 6, 10, 52, 21, 96, 203, 85, 117, 132, 234, 101, 239,
            164, 221, 244, 229, 14, 47, 222, 88, 81, 30, 23, 241,
        ]),
        255,
    ),
};
pub const TEST_TIBER: GatewayNetwork = GatewayNetwork {
    // `ttib7tuX8PTWPqFsmUFQTj78MbRhUmqxidJRDv4hRRE`
    address: Pubkey::new_from_array([
        13, 75, 25, 16, 79, 191, 241, 61, 154, 96, 8, 182, 184, 22, 47, 245, 222, 247, 123, 184,
        212, 183, 224, 132, 29, 120, 183, 206, 131, 102, 52, 109,
    ]),
    // `GbFW949aZ2nRWMxEvd2AX7RQ47Q2GK1CDuN4F6TQFWgt`
    expire_address: (
        Pubkey::new_from_array([
            231, 165, 115, 6, 50, 67, 132, 135, 53, 124, 67, 183, 215, 236, 15, 180, 19, 106, 212,
            180, 188, 60, 246, 150, 34, 210, 33, 41, 14, 130, 10, 61,
        ]),
        253,
    ),
};

/// A list of all cached networks
pub const GATEWAY_NETWORKS: &[GatewayNetwork] = &[IGNITE, TIBER, TEST_TIBER];
