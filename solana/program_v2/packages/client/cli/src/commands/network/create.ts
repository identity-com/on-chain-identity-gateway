import { Command, Flags } from '@oclif/core';
import { Wallet } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  AdminService,
  ExtendedCluster,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import { NetworkFeatures } from '@identity.com/gateway-solana-client/dist/lib/constants';
import { readKeyFromFile } from '../../util/util';

export default class Create extends Command {
  static description = 'Creates a gatekeeper network';

  static examples = [
    `$ gateway network create --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    networkKeypair: Flags.string({
      char: 'n',
      description: 'Path to the network keypair',
      required: true,
    }),
    gaurdianKeypair: Flags.string({
      char: 'g',
      description: 'Path to the gaurdian keypair',
      required: true,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: true,
    }),
    token: Flags.string({
      char: 't',
      description: 'A supported SPL token to accept fees in',
      required: true,
    }),
    fees: Flags.string({
      char: 'f',
      description: 'The amount of fees to charge for the token provided',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';

    const token = flags.token;
    const fee = parseInt(flags.fees);

    const gaurdianKeypair = readKeyFromFile(flags.gaurdianKeypair);
    const gaurdianWallet = new Wallet(gaurdianKeypair);

    this.log(`Gaurdian Authority: ${gaurdianWallet.publicKey.toBase58()}`);

    const networkKeypair = readKeyFromFile(flags.networkKeypair);

    const adminService = await AdminService.build(networkKeypair.publicKey, {
      wallet: gaurdianWallet,
      clusterType: cluster as ExtendedCluster,
    });

    // TODO: Allow specifying granular fees (IDCOM-2380)
    const networkData = {
      authThreshold: 1,
      passExpireTime: 0,
      fees: [
        {
          token: new PublicKey(token),
          issue: fee,
          refresh: fee,
          expire: fee,
          verify: fee,
        },
      ],
      authKeys: [
        {
          flags:
            NetworkKeyFlags.AUTH |
            NetworkKeyFlags.CREATE_GATEKEEPER |
            NetworkKeyFlags.ADD_FEES |
            NetworkKeyFlags.ADJUST_FEES |
            NetworkKeyFlags.SET_EXPIRE_TIME,
          key: networkKeypair.publicKey,
        },
      ],
      gatekeepers: [],
      supportedTokens: [],
      networkFeatures: NetworkFeatures.CHANGE_PASS_GATEKEEPER,
    };
    const networkSignature = await adminService
      .createNetwork(networkData)
      .withPartialSigners(networkKeypair)
      .rpc();

    this.log(`Network Signature: ${networkSignature}`);
  }
}
