import { Command, Flags } from '@oclif/core';
import { Wallet } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import {
  AdminService,
  ExtendedCluster,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import fsPromises from 'node:fs/promises';
import { NetworkFeatures } from '@identity.com/gateway-solana-client/dist/lib/constants';

export default class Create extends Command {
  static description = 'Creates a gatekeeper network';

  static examples = [
    `$ gateway network create --keypair [path to keypair] --index [network index] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    keypair: Flags.string({
      char: 'k',
      description: 'Path to a Solana keypair',
      required: true,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
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
    const localSecretKey = await fsPromises.readFile(`${flags.auth}`);
    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authority = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authority.publicKey.toBase58()}`);

    const adminService = await AdminService.build(authorityKeypair.publicKey, {
      wallet: authority,
      clusterType: cluster as ExtendedCluster,
    });

    const networkData = {
      authThreshold: 1,
      passExpireTime: 16,
      fees: [],
      authKeys: [
        {
          flags:
            NetworkKeyFlags.AUTH |
            NetworkKeyFlags.ADD_FEES |
            NetworkKeyFlags.ADJUST_FEES |
            NetworkKeyFlags.SET_EXPIRE_TIME,
          key: authority.publicKey,
        },
      ],
      gatekeepers: [],
      supportedTokens: [],
      networkFeatures: NetworkFeatures.CHANGE_PASS_GATEKEEPER,
    };
    const networkSignature = await adminService
      .createNetwork(networkData)
      .rpc();

    this.log(`Network Signature: ${networkSignature}`);
  }
}
