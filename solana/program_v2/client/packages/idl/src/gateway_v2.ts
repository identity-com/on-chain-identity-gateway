export type GatewayV2 = {
  version: '0.1.0';
  name: 'gateway_v2';
  instructions: [
    {
      name: 'createNetwork';
      accounts: [
        {
          name: 'network';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'data';
          type: {
            defined: 'CreateNetworkData';
          };
        }
      ];
    },
    {
      name: 'updateNetwork';
      accounts: [
        {
          name: 'network';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'data';
          type: {
            defined: 'UpdateNetworkData';
          };
        }
      ];
    },
    {
      name: 'closeNetwork';
      accounts: [
        {
          name: 'network';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'destination';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'gatekeeperNetwork';
      docs: ['A gatekeeper network which manages many [`Gatekeeper`]s.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'version';
            docs: [
              'The version of this struct, should be 0 until a new version is released'
            ];
            type: 'u8';
          },
          {
            name: 'authority';
            docs: ['The initial authority key'];
            type: 'publicKey';
          },
          {
            name: 'networkIndex';
            docs: ['the index of the network'];
            type: 'u16';
          },
          {
            name: 'networkBump';
            docs: ['The bump for the signer'];
            type: 'u8';
          },
          {
            name: 'passExpireTime';
            docs: [
              'The length of time a pass lasts in seconds. `0` means does not expire.'
            ];
            type: 'i64';
          },
          {
            name: 'networkFeatures';
            docs: [
              'Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.'
            ];
            type: 'u32';
          },
          {
            name: 'fees';
            docs: ['The fees for this network'];
            type: {
              vec: {
                defined: 'NetworkFees';
              };
            };
          },
          {
            name: 'supportedTokens';
            type: {
              vec: {
                defined: 'SupportedToken';
              };
            };
          },
          {
            name: 'gatekeepers';
            docs: ['A set of all active gatekeepers in the network'];
            type: {
              vec: 'publicKey';
            };
          },
          {
            name: 'authThreshold';
            docs: ['The number of auth keys needed to change the `auth_keys`'];
            type: 'u8';
          },
          {
            name: 'authKeys';
            docs: ['Keys with permissions on the network'];
            type: {
              vec: {
                defined: 'NetworkAuthKey';
              };
            };
          }
        ];
      };
    }
  ];
  types: [
    {
      name: 'CreateNetworkData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authThreshold';
            docs: ['The [`GatekeeperNetwork::auth_threshold`].'];
            type: 'u8';
          },
          {
            name: 'passExpireTime';
            docs: ['The [`GatekeeperNetwork::pass_expire_time`].'];
            type: 'i64';
          },
          {
            name: 'fees';
            docs: ['The [`GatekeeperNetwork::fees`].'];
            type: {
              vec: {
                defined: 'NetworkFees';
              };
            };
          },
          {
            name: 'authKeys';
            docs: ['The [`GatekeeperNetwork::auth_keys`].'];
            type: {
              vec: {
                defined: 'NetworkAuthKey';
              };
            };
          },
          {
            name: 'networkIndex';
            type: 'u16';
          },
          {
            name: 'gatekeepers';
            type: {
              vec: 'publicKey';
            };
          },
          {
            name: 'supportedTokens';
            type: {
              vec: {
                defined: 'SupportedToken';
              };
            };
          }
        ];
      };
    },
    {
      name: 'UpdateNetworkData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authThreshold';
            docs: ['The [`GatekeeperNetwork::auth_threshold`].'];
            type: 'u8';
          },
          {
            name: 'passExpireTime';
            docs: ['The [`GatekeeperNetwork::pass_expire_time`].'];
            type: {
              option: 'i64';
            };
          },
          {
            name: 'fees';
            docs: ['The [`GatekeeperNetwork::fees`].'];
            type: {
              defined: 'UpdateFees';
            };
          },
          {
            name: 'authKeys';
            docs: ['The [`GatekeeperNetwork::auth_keys`].'];
            type: {
              defined: 'UpdateKeys';
            };
          },
          {
            name: 'networkFeatures';
            docs: ['The [`GatekeeperNetwork::network_features`].'];
            type: 'u32';
          },
          {
            name: 'supportedTokens';
            docs: ['The [`GatekeeperNetwork::supported_tokens`].'];
            type: {
              defined: 'UpdateSupportedTokens';
            };
          },
          {
            name: 'gatekeepers';
            docs: ['The [`GatekeeperNetwork::gatekeepers`].'];
            type: {
              defined: 'UpdateGatekeepers';
            };
          }
        ];
      };
    },
    {
      name: 'UpdateSupportedTokens';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: {
                defined: 'SupportedToken';
              };
            };
          },
          {
            name: 'remove';
            type: {
              vec: 'publicKey';
            };
          }
        ];
      };
    },
    {
      name: 'UpdateGatekeepers';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: 'publicKey';
            };
          },
          {
            name: 'remove';
            type: {
              vec: 'publicKey';
            };
          }
        ];
      };
    },
    {
      name: 'UpdateFees';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: {
                defined: 'NetworkFees';
              };
            };
          },
          {
            name: 'remove';
            type: {
              vec: 'publicKey';
            };
          }
        ];
      };
    },
    {
      name: 'UpdateKeys';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: {
                defined: 'NetworkAuthKey';
              };
            };
          },
          {
            name: 'remove';
            type: {
              vec: 'publicKey';
            };
          }
        ];
      };
    },
    {
      name: 'SupportedToken';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'key';
            type: 'publicKey';
          },
          {
            name: 'settlementInfo';
            type: {
              defined: 'SettlementInfo';
            };
          }
        ];
      };
    },
    {
      name: 'SettlementInfo';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'placeholder';
            type: 'u16';
          }
        ];
      };
    },
    {
      name: 'NetworkAuthKey';
      docs: ['The authority key for a [`GatekeeperNetwork`]'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'flags';
            docs: ['The permissions this key has'];
            type: 'u16';
          },
          {
            name: 'key';
            docs: ['The key'];
            type: 'publicKey';
          }
        ];
      };
    },
    {
      name: 'NetworkFees';
      docs: ['Fees that a [`GatekeeperNetwork`] can charge'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            docs: ['The token for the fee, `None` means fee is invalid'];
            type: 'publicKey';
          },
          {
            name: 'issue';
            docs: [
              'Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).'
            ];
            type: 'u16';
          },
          {
            name: 'refresh';
            docs: [
              'Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).'
            ];
            type: 'u16';
          },
          {
            name: 'expire';
            docs: [
              'Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).'
            ];
            type: 'u16';
          },
          {
            name: 'verify';
            docs: [
              'Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).'
            ];
            type: 'u16';
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'NoAuthKeys';
      msg: 'No auth keys provided';
    },
    {
      code: 6001;
      name: 'InsufficientAuthKeys';
      msg: 'Not enough auth keys provided';
    },
    {
      code: 6002;
      name: 'InsufficientAccessAuthKeys';
      msg: 'Insufficient access to update auth keys';
    },
    {
      code: 6003;
      name: 'InsufficientAccessExpiry';
      msg: 'Insufficient access to set expiry time';
    },
    {
      code: 6004;
      name: 'AuthKeyNotFound';
      msg: 'Auth key not found';
    },
    {
      code: 6005;
      name: 'InvalidKey';
      msg: 'Invalid key provided';
    },
    {
      code: 6006;
      name: 'AccountInUse';
      msg: 'The network account is in use';
    }
  ];
};

export const IDL: GatewayV2 = {
  version: '0.1.0',
  name: 'gateway_v2',
  instructions: [
    {
      name: 'createNetwork',
      accounts: [
        {
          name: 'network',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'data',
          type: {
            defined: 'CreateNetworkData',
          },
        },
      ],
    },
    {
      name: 'updateNetwork',
      accounts: [
        {
          name: 'network',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'data',
          type: {
            defined: 'UpdateNetworkData',
          },
        },
      ],
    },
    {
      name: 'closeNetwork',
      accounts: [
        {
          name: 'network',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'destination',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'gatekeeperNetwork',
      docs: ['A gatekeeper network which manages many [`Gatekeeper`]s.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'version',
            docs: [
              'The version of this struct, should be 0 until a new version is released',
            ],
            type: 'u8',
          },
          {
            name: 'authority',
            docs: ['The initial authority key'],
            type: 'publicKey',
          },
          {
            name: 'networkIndex',
            docs: ['the index of the network'],
            type: 'u16',
          },
          {
            name: 'networkBump',
            docs: ['The bump for the signer'],
            type: 'u8',
          },
          {
            name: 'passExpireTime',
            docs: [
              'The length of time a pass lasts in seconds. `0` means does not expire.',
            ],
            type: 'i64',
          },
          {
            name: 'networkFeatures',
            docs: [
              'Features on the network, index relates to which feature it is. There are 32 bytes of data available for each feature.',
            ],
            type: 'u32',
          },
          {
            name: 'fees',
            docs: ['The fees for this network'],
            type: {
              vec: {
                defined: 'NetworkFees',
              },
            },
          },
          {
            name: 'supportedTokens',
            type: {
              vec: {
                defined: 'SupportedToken',
              },
            },
          },
          {
            name: 'gatekeepers',
            docs: ['A set of all active gatekeepers in the network'],
            type: {
              vec: 'publicKey',
            },
          },
          {
            name: 'authThreshold',
            docs: ['The number of auth keys needed to change the `auth_keys`'],
            type: 'u8',
          },
          {
            name: 'authKeys',
            docs: ['Keys with permissions on the network'],
            type: {
              vec: {
                defined: 'NetworkAuthKey',
              },
            },
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'CreateNetworkData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authThreshold',
            docs: ['The [`GatekeeperNetwork::auth_threshold`].'],
            type: 'u8',
          },
          {
            name: 'passExpireTime',
            docs: ['The [`GatekeeperNetwork::pass_expire_time`].'],
            type: 'i64',
          },
          {
            name: 'fees',
            docs: ['The [`GatekeeperNetwork::fees`].'],
            type: {
              vec: {
                defined: 'NetworkFees',
              },
            },
          },
          {
            name: 'authKeys',
            docs: ['The [`GatekeeperNetwork::auth_keys`].'],
            type: {
              vec: {
                defined: 'NetworkAuthKey',
              },
            },
          },
          {
            name: 'networkIndex',
            type: 'u16',
          },
          {
            name: 'gatekeepers',
            type: {
              vec: 'publicKey',
            },
          },
          {
            name: 'supportedTokens',
            type: {
              vec: {
                defined: 'SupportedToken',
              },
            },
          },
        ],
      },
    },
    {
      name: 'UpdateNetworkData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authThreshold',
            docs: ['The [`GatekeeperNetwork::auth_threshold`].'],
            type: 'u8',
          },
          {
            name: 'passExpireTime',
            docs: ['The [`GatekeeperNetwork::pass_expire_time`].'],
            type: {
              option: 'i64',
            },
          },
          {
            name: 'fees',
            docs: ['The [`GatekeeperNetwork::fees`].'],
            type: {
              defined: 'UpdateFees',
            },
          },
          {
            name: 'authKeys',
            docs: ['The [`GatekeeperNetwork::auth_keys`].'],
            type: {
              defined: 'UpdateKeys',
            },
          },
          {
            name: 'networkFeatures',
            docs: ['The [`GatekeeperNetwork::network_features`].'],
            type: 'u32',
          },
          {
            name: 'supportedTokens',
            docs: ['The [`GatekeeperNetwork::supported_tokens`].'],
            type: {
              defined: 'UpdateSupportedTokens',
            },
          },
          {
            name: 'gatekeepers',
            docs: ['The [`GatekeeperNetwork::gatekeepers`].'],
            type: {
              defined: 'UpdateGatekeepers',
            },
          },
        ],
      },
    },
    {
      name: 'UpdateSupportedTokens',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: {
                defined: 'SupportedToken',
              },
            },
          },
          {
            name: 'remove',
            type: {
              vec: 'publicKey',
            },
          },
        ],
      },
    },
    {
      name: 'UpdateGatekeepers',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: 'publicKey',
            },
          },
          {
            name: 'remove',
            type: {
              vec: 'publicKey',
            },
          },
        ],
      },
    },
    {
      name: 'UpdateFees',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: {
                defined: 'NetworkFees',
              },
            },
          },
          {
            name: 'remove',
            type: {
              vec: 'publicKey',
            },
          },
        ],
      },
    },
    {
      name: 'UpdateKeys',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: {
                defined: 'NetworkAuthKey',
              },
            },
          },
          {
            name: 'remove',
            type: {
              vec: 'publicKey',
            },
          },
        ],
      },
    },
    {
      name: 'SupportedToken',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'key',
            type: 'publicKey',
          },
          {
            name: 'settlementInfo',
            type: {
              defined: 'SettlementInfo',
            },
          },
        ],
      },
    },
    {
      name: 'SettlementInfo',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'placeholder',
            type: 'u16',
          },
        ],
      },
    },
    {
      name: 'NetworkAuthKey',
      docs: ['The authority key for a [`GatekeeperNetwork`]'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'flags',
            docs: ['The permissions this key has'],
            type: 'u16',
          },
          {
            name: 'key',
            docs: ['The key'],
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'NetworkFees',
      docs: ['Fees that a [`GatekeeperNetwork`] can charge'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'token',
            docs: ['The token for the fee, `None` means fee is invalid'],
            type: 'publicKey',
          },
          {
            name: 'issue',
            docs: [
              'Percentage taken on issue. In Hundredths of a percent (0.01% or 0.0001).',
            ],
            type: 'u16',
          },
          {
            name: 'refresh',
            docs: [
              'Percentage taken on refresh. In Hundredths of a percent (0.01% or 0.0001).',
            ],
            type: 'u16',
          },
          {
            name: 'expire',
            docs: [
              'Percentage taken on expire. In Hundredths of a percent (0.01% or 0.0001).',
            ],
            type: 'u16',
          },
          {
            name: 'verify',
            docs: [
              'Percentage taken on verify. In Hundredths of a percent (0.01% or 0.0001).',
            ],
            type: 'u16',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'NoAuthKeys',
      msg: 'No auth keys provided',
    },
    {
      code: 6001,
      name: 'InsufficientAuthKeys',
      msg: 'Not enough auth keys provided',
    },
    {
      code: 6002,
      name: 'InsufficientAccessAuthKeys',
      msg: 'Insufficient access to update auth keys',
    },
    {
      code: 6003,
      name: 'InsufficientAccessExpiry',
      msg: 'Insufficient access to set expiry time',
    },
    {
      code: 6004,
      name: 'AuthKeyNotFound',
      msg: 'Auth key not found',
    },
    {
      code: 6005,
      name: 'InvalidKey',
      msg: 'Invalid key provided',
    },
    {
      code: 6006,
      name: 'AccountInUse',
      msg: 'The network account is in use',
    },
  ],
};
