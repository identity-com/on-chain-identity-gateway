import { Command, Flags } from '@oclif/core';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  AdminService,
  airdrop,
  UpdateNetworkData,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { parseNetworkUpdateData } from '../../../util/util';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Updates a gatekeeper network';

  static examples = [
    `$ gateway network update --network [address] --data [path to JSON update data] --funder [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    network: Flags.string({
      char: 'n',
      description: 'The network id',
      required: true,
    }),
    data: Flags.string({
      char: 'd',
      description:
        'Path to a JSON data file representing the new state of the network',
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
    const data = await fsPromises.readFile(`${__dirname}/${flags.data}`);
    const updateData = JSON.parse(data.toString()) as UpdateNetworkData;
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/guardian-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authorityKeypair.publicKey.toBase58()}`);

    const service = await AdminService.build(network, {
      wallet: authorityWallet,
      clusterType: cluster as ExtendedCluster,
    });

    await airdrop(
      service.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL
    );

    const parsedData = parseNetworkUpdateData(updateData);

    const updateNetworkSignature = await service
      .updateNetwork(parsedData)
      .rpc();
    this.log(updateNetworkSignature);
    const updatedNetwork = await service.getNetworkAccount();
    this.log(updatedNetwork?.fees[0].token.toBase58());
  }
}
