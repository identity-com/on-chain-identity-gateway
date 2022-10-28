import { Command, Flags } from '@oclif/core';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import * as anchor from '@project-serum/anchor';
import {
  AdminService,
  airdrop,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Closes a gatekeeper network';

  static examples = [
    `$ gateway network close --network [address] --funder [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    network: Flags.string({
      char: 'n',
      description: 'The network id',
      required: true,
    }),
    funder: Flags.string({
      char: 'f',
      description: 'The funder account',
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
    const { flags } = await this.parse(Close);

    const network = new PublicKey(flags.network);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/guardian-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);

    const service = await AdminService.build(network, {
      wallet: authorityWallet,
      clusterType: cluster as ExtendedCluster,
    });

    await airdrop(
      service.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL
    );

    const closedNetworkSignature = await service.closeNetwork().rpc();
    this.log(`Network Closure TX Signature: ${closedNetworkSignature}`);
  }
}
