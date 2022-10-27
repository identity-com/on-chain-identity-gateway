import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  AdminService,
  airdrop,
  NetworkKeyFlags,
} from '@identity.com/gateway-solana-client';
import fsPromises from 'node:fs/promises';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';
export default class Create extends Command {
  static description = 'Creates a gatekeeper network';

  static examples = [
    `$ gateway network create --address ./network.json --funder ./funder-keypair.json --cluster localnet
Latest Blockhash: [blockhash]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
    // TODO: Implement Properly
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: false,
    }),
    index: Flags.integer({
      char: 'i',
      description: 'The index of the network to create',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/guardian-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const networkIndex = flags.index;
    this.log(`Network Index: ${networkIndex}`);

    const authority = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authority.publicKey.toBase58()}`);

    const [dataAccount] = await AdminService.createNetworkAddress(
      authority.publicKey,
      networkIndex
    );
    this.log(`Network Address: ${dataAccount}`);

    const adminService = await AdminService.build(dataAccount, {
      wallet: authority,
      clusterType: 'localnet' as ExtendedCluster,
    });

    await airdrop(
      adminService.getConnection(),
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );
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
      networkIndex: networkIndex,
      gatekeepers: [],
      supportedTokens: [],
    };
    const networkSignature = await adminService
      .createNetwork(networkData)
      .rpc();

    this.log(`Network Signature: ${networkSignature}`);
  }
}
