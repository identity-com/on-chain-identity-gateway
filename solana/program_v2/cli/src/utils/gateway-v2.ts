export type GatewayV2 = {
  version: "0.1.0";
  name: "gateway_v2";
  instructions: [
    {
      name: "createNetwork";
      accounts: [
        {
          name: "network";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "data";
          type: {
            defined: "CreateNetworkData";
          };
        }
      ];
    },
    {
      name: "updateNetwork";
      accounts: [
        {
          name: "network";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "data";
          type: {
            defined: "UpdateNetworkData";
          };
        }
      ];
    },
    {
      name: "closeNetwork";
      accounts: [
        {
          name: "network";
          isMut: true;
          isSigner: false;
        },
        {
          name: "receiver";
          isMut: true;
          isSigner: false;
        },
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "gatekeeperNetwork";
      docs: ["A gatekeeper network which manages many [`Gatekeeper`]s."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "version";
            docs: [
              "The version of this struct, should be 0 until a new version is released"
            ];
            type: "u8";
          },
          {
            name: "initialAuthority";
            docs: ["The initial authority key"];
            type: "publicKey";
          },
          {
            name: "authThreshold";
            docs: ["The number of auth keys needed to change the `auth_keys`"];
            type: "u8";
          },
          {
            name: "passExpireTime";
            docs: [
              "The length of time a pass lasts in seconds. `0` means does not expire."
            ];
            type: "i64";
          },
          {
            name: "signerBump";
            docs: ["The bump for the signer"];
            type: "u8";
          },
          {
            name: "fees";
            docs: ["The fees for this network"];
            type: {
              vec: {
                defined: "NetworkFees";
              };
            };
          },
          {
            name: "authKeys";
            docs: ["Keys with permissions on the network"];
            type: {
              vec: {
                defined: "NetworkAuthKey";
              };
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "NetworkAuthKey";
      docs: ["The authority key for a [`GatekeeperNetwork`]"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "flags";
            docs: ["The permissions this key has"];
            type: "u16";
          },
          {
            name: "key";
            docs: ["The key"];
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "CreateNetworkData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authThreshold";
            docs: ["The [`GatekeeperNetwork::auth_threshold`]."];
            type: "u8";
          },
          {
            name: "passExpireTime";
            docs: ["The [`GatekeeperNetwork::pass_expire_time`]."];
            type: "i64";
          },
          {
            name: "networkDataLen";
            docs: ["The [`GatekeeperNetwork::network_data_len`]."];
            type: "u16";
          },
          {
            name: "fees";
            docs: ["The [`GatekeeperNetwork::fees`]."];
            type: {
              vec: {
                defined: "NetworkFees";
              };
            };
          },
          {
            name: "authKeys";
            docs: ["The [`GatekeeperNetwork::auth_keys`]."];
            type: {
              vec: {
                defined: "NetworkAuthKey";
              };
            };
          }
        ];
      };
    },
    {
      name: "UpdateFees";
      type: {
        kind: "struct";
        fields: [
          {
            name: "add";
            type: {
              vec: {
                defined: "NetworkFees";
              };
            };
          },
          {
            name: "remove";
            type: {
              vec: {
                defined: "NetworkFees";
              };
            };
          }
        ];
      };
    },
    {
      name: "UpdateKeys";
      type: {
        kind: "struct";
        fields: [
          {
            name: "add";
            type: {
              vec: {
                defined: "NetworkAuthKey";
              };
            };
          },
          {
            name: "remove";
            type: {
              vec: "publicKey";
            };
          }
        ];
      };
    },
    {
      name: "UpdateNetworkData";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authThreshold";
            docs: ["The [`GatekeeperNetwork::auth_threshold`]."];
            type: "u8";
          },
          {
            name: "passExpireTime";
            docs: ["The [`GatekeeperNetwork::pass_expire_time`]."];
            type: {
              option: "i64";
            };
          },
          {
            name: "fees";
            docs: ["The [`GatekeeperNetwork::signer_bump`]."];
            type: {
              defined: "UpdateFees";
            };
          },
          {
            name: "authKeys";
            docs: ["The [`GatekeeperNetwork::auth_keys`]."];
            type: {
              defined: "UpdateKeys";
            };
          }
        ];
      };
    },
    {
      name: "NetworkFees";
      docs: ["Fees that a [`GatekeeperNetwork`] can charge"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "token";
            docs: ["The token for the fee, `None` means fee is invalid"];
            type: "publicKey";
          },
          {
            name: "issue";
            docs: [
              "Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001)."
            ];
            type: "u16";
          },
          {
            name: "refresh";
            docs: [
              "Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001)."
            ];
            type: "u16";
          },
          {
            name: "expire";
            docs: [
              "Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001)."
            ];
            type: "u16";
          },
          {
            name: "verify";
            docs: [
              "Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001)."
            ];
            type: "u16";
          }
        ];
      };
    },
    {
      name: "GatekeeperFees";
      docs: ["The fees a gatekeeper/network can take"];
      type: {
        kind: "struct";
        fields: [
          {
            name: "token";
            docs: [
              "The token for these fees. None value for this means native SOL price"
            ];
            type: "publicKey";
          },
          {
            name: "issue";
            docs: [
              "Fees taken at issuance of a new pass in token units or lamports for SOL."
            ];
            type: "u64";
          },
          {
            name: "refresh";
            docs: [
              "Fees taken when a pass is refreshed in token units or lamports for SOL."
            ];
            type: "u64";
          },
          {
            name: "expire";
            docs: [
              "The fee taken when a pass is expired in token units or lamports for SOL.",
              "This should only be used where pass value comes from one-time use."
            ];
            type: "u64";
          },
          {
            name: "verify";
            docs: [
              "The fee taken when a pass is verified in token units or lamports for SOL.",
              "This should only be used where pass value comes from proper use"
            ];
            type: "u64";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "NoAuthKeys";
      msg: "No auth keys provided";
    },
    {
      code: 6001;
      name: "InsufficientAuthKeys";
      msg: "Not enough auth keys provided";
    },
    {
      code: 6002;
      name: "InsufficientAccessAuthKeys";
      msg: "Insufficient access to update auth keys";
    },
    {
      code: 6003;
      name: "InsufficientAccessExpiry";
      msg: "Insufficient access to set expiry time";
    },
    {
      code: 6004;
      name: "AuthKeyNotFound";
      msg: "Auth key not found";
    }
  ];
};

export const IDL: GatewayV2 = {
  version: "0.1.0",
  name: "gateway_v2",
  instructions: [
    {
      name: "createNetwork",
      accounts: [
        {
          name: "network",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "data",
          type: {
            defined: "CreateNetworkData",
          },
        },
      ],
    },
    {
      name: "updateNetwork",
      accounts: [
        {
          name: "network",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: true,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "data",
          type: {
            defined: "UpdateNetworkData",
          },
        },
      ],
    },
    {
      name: "closeNetwork",
      accounts: [
        {
          name: "network",
          isMut: true,
          isSigner: false,
        },
        {
          name: "receiver",
          isMut: true,
          isSigner: false,
        },
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "gatekeeperNetwork",
      docs: ["A gatekeeper network which manages many [`Gatekeeper`]s."],
      type: {
        kind: "struct",
        fields: [
          {
            name: "version",
            docs: [
              "The version of this struct, should be 0 until a new version is released",
            ],
            type: "u8",
          },
          {
            name: "initialAuthority",
            docs: ["The initial authority key"],
            type: "publicKey",
          },
          {
            name: "authThreshold",
            docs: ["The number of auth keys needed to change the `auth_keys`"],
            type: "u8",
          },
          {
            name: "passExpireTime",
            docs: [
              "The length of time a pass lasts in seconds. `0` means does not expire.",
            ],
            type: "i64",
          },
          {
            name: "signerBump",
            docs: ["The bump for the signer"],
            type: "u8",
          },
          {
            name: "fees",
            docs: ["The fees for this network"],
            type: {
              vec: {
                defined: "NetworkFees",
              },
            },
          },
          {
            name: "authKeys",
            docs: ["Keys with permissions on the network"],
            type: {
              vec: {
                defined: "NetworkAuthKey",
              },
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "NetworkAuthKey",
      docs: ["The authority key for a [`GatekeeperNetwork`]"],
      type: {
        kind: "struct",
        fields: [
          {
            name: "flags",
            docs: ["The permissions this key has"],
            type: "u16",
          },
          {
            name: "key",
            docs: ["The key"],
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "CreateNetworkData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authThreshold",
            docs: ["The [`GatekeeperNetwork::auth_threshold`]."],
            type: "u8",
          },
          {
            name: "passExpireTime",
            docs: ["The [`GatekeeperNetwork::pass_expire_time`]."],
            type: "i64",
          },
          {
            name: "networkDataLen",
            docs: ["The [`GatekeeperNetwork::network_data_len`]."],
            type: "u16",
          },
          {
            name: "fees",
            docs: ["The [`GatekeeperNetwork::fees`]."],
            type: {
              vec: {
                defined: "NetworkFees",
              },
            },
          },
          {
            name: "authKeys",
            docs: ["The [`GatekeeperNetwork::auth_keys`]."],
            type: {
              vec: {
                defined: "NetworkAuthKey",
              },
            },
          },
        ],
      },
    },
    {
      name: "UpdateFees",
      type: {
        kind: "struct",
        fields: [
          {
            name: "add",
            type: {
              vec: {
                defined: "NetworkFees",
              },
            },
          },
          {
            name: "remove",
            type: {
              vec: {
                defined: "NetworkFees",
              },
            },
          },
        ],
      },
    },
    {
      name: "UpdateKeys",
      type: {
        kind: "struct",
        fields: [
          {
            name: "add",
            type: {
              vec: {
                defined: "NetworkAuthKey",
              },
            },
          },
          {
            name: "remove",
            type: {
              vec: "publicKey",
            },
          },
        ],
      },
    },
    {
      name: "UpdateNetworkData",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authThreshold",
            docs: ["The [`GatekeeperNetwork::auth_threshold`]."],
            type: "u8",
          },
          {
            name: "passExpireTime",
            docs: ["The [`GatekeeperNetwork::pass_expire_time`]."],
            type: {
              option: "i64",
            },
          },
          {
            name: "fees",
            docs: ["The [`GatekeeperNetwork::signer_bump`]."],
            type: {
              defined: "UpdateFees",
            },
          },
          {
            name: "authKeys",
            docs: ["The [`GatekeeperNetwork::auth_keys`]."],
            type: {
              defined: "UpdateKeys",
            },
          },
        ],
      },
    },
    {
      name: "NetworkFees",
      docs: ["Fees that a [`GatekeeperNetwork`] can charge"],
      type: {
        kind: "struct",
        fields: [
          {
            name: "token",
            docs: ["The token for the fee, `None` means fee is invalid"],
            type: "publicKey",
          },
          {
            name: "issue",
            docs: [
              "Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).",
            ],
            type: "u16",
          },
          {
            name: "refresh",
            docs: [
              "Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).",
            ],
            type: "u16",
          },
          {
            name: "expire",
            docs: [
              "Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).",
            ],
            type: "u16",
          },
          {
            name: "verify",
            docs: [
              "Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).",
            ],
            type: "u16",
          },
        ],
      },
    },
    {
      name: "GatekeeperFees",
      docs: ["The fees a gatekeeper/network can take"],
      type: {
        kind: "struct",
        fields: [
          {
            name: "token",
            docs: [
              "The token for these fees. None value for this means native SOL price",
            ],
            type: "publicKey",
          },
          {
            name: "issue",
            docs: [
              "Fees taken at issuance of a new pass in token units or lamports for SOL.",
            ],
            type: "u64",
          },
          {
            name: "refresh",
            docs: [
              "Fees taken when a pass is refreshed in token units or lamports for SOL.",
            ],
            type: "u64",
          },
          {
            name: "expire",
            docs: [
              "The fee taken when a pass is expired in token units or lamports for SOL.",
              "This should only be used where pass value comes from one-time use.",
            ],
            type: "u64",
          },
          {
            name: "verify",
            docs: [
              "The fee taken when a pass is verified in token units or lamports for SOL.",
              "This should only be used where pass value comes from proper use",
            ],
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "NoAuthKeys",
      msg: "No auth keys provided",
    },
    {
      code: 6001,
      name: "InsufficientAuthKeys",
      msg: "Not enough auth keys provided",
    },
    {
      code: 6002,
      name: "InsufficientAccessAuthKeys",
      msg: "Insufficient access to update auth keys",
    },
    {
      code: 6003,
      name: "InsufficientAccessExpiry",
      msg: "Insufficient access to set expiry time",
    },
    {
      code: 6004,
      name: "AuthKeyNotFound",
      msg: "Auth key not found",
    },
  ],
};
