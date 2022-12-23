export type SolanaAnchorGateway = {
  version: '2.0.2';
  name: 'solana_anchor_gateway';
  instructions: [
    {
      name: 'createNetwork';
      accounts: [
        {
          name: 'network';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: false;
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
    },
    {
      name: 'createGatekeeper';
      accounts: [
        {
          name: 'gatekeeper';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'network';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'stakingAccount';
          isMut: true;
          isSigner: false;
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
            defined: 'CreateGatekeeperData';
          };
        }
      ];
    },
    {
      name: 'updateGatekeeper';
      accounts: [
        {
          name: 'gatekeeper';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'stakingAccount';
          isMut: true;
          isSigner: false;
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
            defined: 'UpdateGatekeeperData';
          };
        }
      ];
    },
    {
      name: 'closeGatekeeper';
      accounts: [
        {
          name: 'gatekeeper';
          isMut: true;
          isSigner: false;
        },
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
          isMut: true;
          isSigner: true;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'setGatekeeperState';
      accounts: [
        {
          name: 'gatekeeper';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'network';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'state';
          type: {
            defined: 'GatekeeperState';
          };
        }
      ];
    },
    {
      name: 'gatekeeperWithdraw';
      accounts: [
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'splTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'receiverTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'gatekeeperTokenAccount';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'issuePass';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'network';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'funder';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'splTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mintAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'funderTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'networkTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'gatekeeperTokenAccount';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'subject';
          type: 'publicKey';
        },
        {
          name: 'passNumber';
          type: 'u16';
        }
      ];
    },
    {
      name: 'setPassState';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'state';
          type: {
            defined: 'PassState';
          };
        }
      ];
    },
    {
      name: 'refreshPass';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'funder';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'network';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'splTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mintAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'funderTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'networkTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'gatekeeperTokenAccount';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'changePassGatekeeper';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'oldGatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'newGatekeeper';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'setPassData';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'gatekeeperData';
          type: {
            option: {
              array: ['u8', 32];
            };
          };
        },
        {
          name: 'networkData';
          type: {
            option: {
              array: ['u8', 32];
            };
          };
        }
      ];
    },
    {
      name: 'expirePass';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'network';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'funder';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'splTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mintAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'funderTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'networkTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'gatekeeperTokenAccount';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'verifyPass';
      accounts: [
        {
          name: 'pass';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'network';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'gatekeeper';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'funder';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'splTokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'mintAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'funderTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'networkTokenAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'gatekeeperTokenAccount';
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'gatekeeper';
      docs: ['A gatekeeper on a [`GatekeeperNetwork`] that can issue passes'];
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
            docs: ['the authority for this gatekeeper'];
            type: 'publicKey';
          },
          {
            name: 'gatekeeperBump';
            docs: ['The bump for the signer of this gatekeeper'];
            type: 'u8';
          },
          {
            name: 'gatekeeperNetwork';
            docs: ['The [`GatekeeperNetwork`] this gatekeeper is on'];
            type: 'publicKey';
          },
          {
            name: 'stakingAccount';
            docs: ['The staking account of this gatekeeper'];
            type: 'publicKey';
          },
          {
            name: 'gatekeeperState';
            docs: ['The state of this gatekeeper'];
            type: {
              defined: 'GatekeeperState';
            };
          },
          {
            name: 'tokenFees';
            docs: ['The fees for this gatekeeper'];
            type: {
              vec: {
                defined: 'GatekeeperFees';
              };
            };
          },
          {
            name: 'authThreshold';
            docs: ['The number of keys needed to change the `auth_keys`'];
            type: 'u8';
          },
          {
            name: 'authKeys';
            docs: ['The keys with permissions on this gatekeeper'];
            type: {
              vec: {
                defined: 'GatekeeperAuthKey';
              };
            };
          }
        ];
      };
    },
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
                defined: 'NetworkFeesPercentage';
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
                defined: 'AuthKey';
              };
            };
          }
        ];
      };
    },
    {
      name: 'pass';
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
            name: 'subject';
            docs: ['The initial authority'];
            type: 'publicKey';
          },
          {
            name: 'network';
            docs: ['The network this pass belongs to'];
            type: 'publicKey';
          },
          {
            name: 'passNumber';
            docs: ['The pass number'];
            type: 'u16';
          },
          {
            name: 'signerBump';
            docs: ['The bump for the signer'];
            type: 'u8';
          },
          {
            name: 'gatekeeper';
            docs: ['The gatekeeper that issued this pass'];
            type: 'publicKey';
          },
          {
            name: 'issueTime';
            docs: ['The issue time of this pass, used for expiry'];
            type: 'i64';
          },
          {
            name: 'state';
            docs: ['The state of this pass'];
            type: {
              defined: 'PassState';
            };
          },
          {
            name: 'networkData';
            docs: ['Additional data from the network'];
            type: {
              array: ['u8', 32];
            };
          },
          {
            name: 'gatekeeperData';
            docs: ['Additional data from the gatekeeper'];
            type: {
              array: ['u8', 32];
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
                defined: 'NetworkFeesPercentage';
              };
            };
          },
          {
            name: 'authKeys';
            docs: ['The [`GatekeeperNetwork::auth_keys`].'];
            type: {
              vec: {
                defined: 'AuthKey';
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
                defined: 'NetworkFeesPercentage';
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
                defined: 'AuthKey';
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
      name: 'CreateGatekeeperData';
      docs: ['Data for [`CreateGatekeeper`]'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tokenFees';
            type: {
              vec: {
                defined: 'GatekeeperFees';
              };
            };
          },
          {
            name: 'authThreshold';
            type: 'u8';
          },
          {
            name: 'authKeys';
            type: {
              vec: {
                defined: 'GatekeeperAuthKey';
              };
            };
          }
        ];
      };
    },
    {
      name: 'UpdateGatekeeperData';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tokenFees';
            docs: ['The fees for this gatekeeper'];
            type: {
              defined: 'UpdateGatekeeperFees';
            };
          },
          {
            name: 'authThreshold';
            docs: ['The [`Gatekeeper::auth_threshold`].'];
            type: {
              option: 'u8';
            };
          },
          {
            name: 'authKeys';
            docs: ['The keys with permissions on this gatekeeper'];
            type: {
              defined: 'UpdateGatekeeperKeys';
            };
          }
        ];
      };
    },
    {
      name: 'UpdateGatekeeperFees';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: {
                defined: 'GatekeeperFees';
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
      name: 'UpdateGatekeeperKeys';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'add';
            type: {
              vec: {
                defined: 'GatekeeperAuthKey';
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
      name: 'GatekeeperAuthKey';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'flags';
            docs: ['The permissions this key has'];
            type: 'u32';
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
      name: 'GatekeeperFees';
      docs: ['The fees a gatekeeper/network can take'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'token';
            docs: [
              'The token for these fees. None value for this means native SOL price'
            ];
            type: 'publicKey';
          },
          {
            name: 'issue';
            docs: [
              'Fees taken at issuance of a new pass in token units or lamports for SOL.'
            ];
            type: 'u64';
          },
          {
            name: 'refresh';
            docs: [
              'Fees taken when a pass is refreshed in token units or lamports for SOL.'
            ];
            type: 'u64';
          },
          {
            name: 'expire';
            docs: [
              'The fee taken when a pass is expired in token units or lamports for SOL.',
              'This should only be used where pass value comes from one-time use.'
            ];
            type: 'u64';
          },
          {
            name: 'verify';
            docs: [
              'The fee taken when a pass is verified in token units or lamports for SOL.',
              'This should only be used where pass value comes from proper use'
            ];
            type: 'u64';
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
      name: 'NetworkFeesPercentage';
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
    },
    {
      name: 'AuthKey';
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
      name: 'GatekeeperErrors';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'NoAuthKeys';
          },
          {
            name: 'InsufficientAuthKeys';
          },
          {
            name: 'InsufficientAccessAuthKeys';
          },
          {
            name: 'AuthKeyNotFound';
          },
          {
            name: 'InvalidKey';
          },
          {
            name: 'InvalidGatekeeper';
          },
          {
            name: 'FeesNotProvided';
          }
        ];
      };
    },
    {
      name: 'PassErrors';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'InvalidStateChange';
          },
          {
            name: 'PassNotActive';
          },
          {
            name: 'InvalidGatekeeper';
          },
          {
            name: 'InvalidNetwork';
          },
          {
            name: 'InvalidPass';
          }
        ];
      };
    },
    {
      name: 'GatekeeperState';
      docs: ['The state of a [`Gatekeeper`]'];
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Active';
          },
          {
            name: 'Frozen';
          },
          {
            name: 'Halted';
          }
        ];
      };
    },
    {
      name: 'PassState';
      docs: ['The state of a [`Pass`].'];
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Active';
          },
          {
            name: 'Frozen';
          },
          {
            name: 'Revoked';
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
    },
    {
      code: 6007;
      name: 'FeesNotProvided';
      msg: 'Network Fee was not provided';
    }
  ];
};

export const IDL: SolanaAnchorGateway = {
  version: '2.0.2',
  name: 'solana_anchor_gateway',
  instructions: [
    {
      name: 'createNetwork',
      accounts: [
        {
          name: 'network',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: false,
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
    {
      name: 'createGatekeeper',
      accounts: [
        {
          name: 'gatekeeper',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'network',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'stakingAccount',
          isMut: true,
          isSigner: false,
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
            defined: 'CreateGatekeeperData',
          },
        },
      ],
    },
    {
      name: 'updateGatekeeper',
      accounts: [
        {
          name: 'gatekeeper',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'stakingAccount',
          isMut: true,
          isSigner: false,
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
            defined: 'UpdateGatekeeperData',
          },
        },
      ],
    },
    {
      name: 'closeGatekeeper',
      accounts: [
        {
          name: 'gatekeeper',
          isMut: true,
          isSigner: false,
        },
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
          isMut: true,
          isSigner: true,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'setGatekeeperState',
      accounts: [
        {
          name: 'gatekeeper',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'network',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'state',
          type: {
            defined: 'GatekeeperState',
          },
        },
      ],
    },
    {
      name: 'gatekeeperWithdraw',
      accounts: [
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'splTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'receiverTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatekeeperTokenAccount',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'issuePass',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'network',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'funder',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'splTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mintAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'funderTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'networkTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatekeeperTokenAccount',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'subject',
          type: 'publicKey',
        },
        {
          name: 'passNumber',
          type: 'u16',
        },
      ],
    },
    {
      name: 'setPassState',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'state',
          type: {
            defined: 'PassState',
          },
        },
      ],
    },
    {
      name: 'refreshPass',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'funder',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'network',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'splTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mintAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'funderTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'networkTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatekeeperTokenAccount',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'changePassGatekeeper',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'oldGatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'newGatekeeper',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'setPassData',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'gatekeeperData',
          type: {
            option: {
              array: ['u8', 32],
            },
          },
        },
        {
          name: 'networkData',
          type: {
            option: {
              array: ['u8', 32],
            },
          },
        },
      ],
    },
    {
      name: 'expirePass',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'network',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'funder',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'splTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mintAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'funderTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'networkTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatekeeperTokenAccount',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'verifyPass',
      accounts: [
        {
          name: 'pass',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'network',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'gatekeeper',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'funder',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'splTokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'mintAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'funderTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'networkTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'gatekeeperTokenAccount',
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: 'gatekeeper',
      docs: ['A gatekeeper on a [`GatekeeperNetwork`] that can issue passes'],
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
            docs: ['the authority for this gatekeeper'],
            type: 'publicKey',
          },
          {
            name: 'gatekeeperBump',
            docs: ['The bump for the signer of this gatekeeper'],
            type: 'u8',
          },
          {
            name: 'gatekeeperNetwork',
            docs: ['The [`GatekeeperNetwork`] this gatekeeper is on'],
            type: 'publicKey',
          },
          {
            name: 'stakingAccount',
            docs: ['The staking account of this gatekeeper'],
            type: 'publicKey',
          },
          {
            name: 'gatekeeperState',
            docs: ['The state of this gatekeeper'],
            type: {
              defined: 'GatekeeperState',
            },
          },
          {
            name: 'tokenFees',
            docs: ['The fees for this gatekeeper'],
            type: {
              vec: {
                defined: 'GatekeeperFees',
              },
            },
          },
          {
            name: 'authThreshold',
            docs: ['The number of keys needed to change the `auth_keys`'],
            type: 'u8',
          },
          {
            name: 'authKeys',
            docs: ['The keys with permissions on this gatekeeper'],
            type: {
              vec: {
                defined: 'GatekeeperAuthKey',
              },
            },
          },
        ],
      },
    },
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
                defined: 'NetworkFeesPercentage',
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
                defined: 'AuthKey',
              },
            },
          },
        ],
      },
    },
    {
      name: 'pass',
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
            name: 'subject',
            docs: ['The initial authority'],
            type: 'publicKey',
          },
          {
            name: 'network',
            docs: ['The network this pass belongs to'],
            type: 'publicKey',
          },
          {
            name: 'passNumber',
            docs: ['The pass number'],
            type: 'u16',
          },
          {
            name: 'signerBump',
            docs: ['The bump for the signer'],
            type: 'u8',
          },
          {
            name: 'gatekeeper',
            docs: ['The gatekeeper that issued this pass'],
            type: 'publicKey',
          },
          {
            name: 'issueTime',
            docs: ['The issue time of this pass, used for expiry'],
            type: 'i64',
          },
          {
            name: 'state',
            docs: ['The state of this pass'],
            type: {
              defined: 'PassState',
            },
          },
          {
            name: 'networkData',
            docs: ['Additional data from the network'],
            type: {
              array: ['u8', 32],
            },
          },
          {
            name: 'gatekeeperData',
            docs: ['Additional data from the gatekeeper'],
            type: {
              array: ['u8', 32],
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
                defined: 'NetworkFeesPercentage',
              },
            },
          },
          {
            name: 'authKeys',
            docs: ['The [`GatekeeperNetwork::auth_keys`].'],
            type: {
              vec: {
                defined: 'AuthKey',
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
                defined: 'NetworkFeesPercentage',
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
                defined: 'AuthKey',
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
      name: 'CreateGatekeeperData',
      docs: ['Data for [`CreateGatekeeper`]'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'tokenFees',
            type: {
              vec: {
                defined: 'GatekeeperFees',
              },
            },
          },
          {
            name: 'authThreshold',
            type: 'u8',
          },
          {
            name: 'authKeys',
            type: {
              vec: {
                defined: 'GatekeeperAuthKey',
              },
            },
          },
        ],
      },
    },
    {
      name: 'UpdateGatekeeperData',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'tokenFees',
            docs: ['The fees for this gatekeeper'],
            type: {
              defined: 'UpdateGatekeeperFees',
            },
          },
          {
            name: 'authThreshold',
            docs: ['The [`Gatekeeper::auth_threshold`].'],
            type: {
              option: 'u8',
            },
          },
          {
            name: 'authKeys',
            docs: ['The keys with permissions on this gatekeeper'],
            type: {
              defined: 'UpdateGatekeeperKeys',
            },
          },
        ],
      },
    },
    {
      name: 'UpdateGatekeeperFees',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: {
                defined: 'GatekeeperFees',
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
      name: 'UpdateGatekeeperKeys',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'add',
            type: {
              vec: {
                defined: 'GatekeeperAuthKey',
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
      name: 'GatekeeperAuthKey',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'flags',
            docs: ['The permissions this key has'],
            type: 'u32',
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
      name: 'GatekeeperFees',
      docs: ['The fees a gatekeeper/network can take'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'token',
            docs: [
              'The token for these fees. None value for this means native SOL price',
            ],
            type: 'publicKey',
          },
          {
            name: 'issue',
            docs: [
              'Fees taken at issuance of a new pass in token units or lamports for SOL.',
            ],
            type: 'u64',
          },
          {
            name: 'refresh',
            docs: [
              'Fees taken when a pass is refreshed in token units or lamports for SOL.',
            ],
            type: 'u64',
          },
          {
            name: 'expire',
            docs: [
              'The fee taken when a pass is expired in token units or lamports for SOL.',
              'This should only be used where pass value comes from one-time use.',
            ],
            type: 'u64',
          },
          {
            name: 'verify',
            docs: [
              'The fee taken when a pass is verified in token units or lamports for SOL.',
              'This should only be used where pass value comes from proper use',
            ],
            type: 'u64',
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
      name: 'NetworkFeesPercentage',
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
    {
      name: 'AuthKey',
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
      name: 'GatekeeperErrors',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'NoAuthKeys',
          },
          {
            name: 'InsufficientAuthKeys',
          },
          {
            name: 'InsufficientAccessAuthKeys',
          },
          {
            name: 'AuthKeyNotFound',
          },
          {
            name: 'InvalidKey',
          },
          {
            name: 'InvalidGatekeeper',
          },
          {
            name: 'FeesNotProvided',
          },
        ],
      },
    },
    {
      name: 'PassErrors',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'InvalidStateChange',
          },
          {
            name: 'PassNotActive',
          },
          {
            name: 'InvalidGatekeeper',
          },
          {
            name: 'InvalidNetwork',
          },
          {
            name: 'InvalidPass',
          },
        ],
      },
    },
    {
      name: 'GatekeeperState',
      docs: ['The state of a [`Gatekeeper`]'],
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Active',
          },
          {
            name: 'Frozen',
          },
          {
            name: 'Halted',
          },
        ],
      },
    },
    {
      name: 'PassState',
      docs: ['The state of a [`Pass`].'],
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Active',
          },
          {
            name: 'Frozen',
          },
          {
            name: 'Revoked',
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
    {
      code: 6007,
      name: 'FeesNotProvided',
      msg: 'Network Fee was not provided',
    },
  ],
};
