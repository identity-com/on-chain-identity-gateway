import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
// import * as anchor from '@project-serum/anchor';
import {
  AdminService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Inspect extends Command {
  static description = 'Inspects a gatekeeper network';

  static examples = [
    `$ gateway network close --network [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    network: Flags.string({
      char: 'n',
      description: 'The network id',
      required: true,
    }),
    keypair: Flags.string({
      char: 'k',
      description: 'Path to a Solana keypair',
      required: true,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The type of cluster',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Inspect);

    const network = new PublicKey(flags.network);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';
    const localSecretKey = await fsPromises.readFile(
      `${__dirname}/${flags.auth}`
    );
    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const service = await AdminService.build(network, {
      wallet: authorityWallet,
      clusterType: cluster as ExtendedCluster,
    });

    const closedNetworkSignature = await service.closeNetwork().rpc();
    this.log(`Network Closure TX Signature: ${closedNetworkSignature}`);
  }
}
