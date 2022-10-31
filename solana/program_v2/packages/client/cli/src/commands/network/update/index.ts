import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  AdminService,
  UpdateNetworkData,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { parseNetworkUpdateData } from '../../../util/util';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Updates a gatekeeper network';

  static examples = [
    `$ gateway network update --network [address] --data [path to JSON update data] --keypair [path to keypair] --cluster [cluster type]
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
    keypair: Flags.string({
      char: 'k',
      description: 'Path to Solana keypair',
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
    const localSecretKey = await fsPromises.readFile(
      `${__dirname}/${flags.auth}`
    );
    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authorityKeypair.publicKey.toBase58()}`);

    const service = await AdminService.build(network, {
      wallet: authorityWallet,
      clusterType: cluster as ExtendedCluster,
    });

    const parsedData = parseNetworkUpdateData(updateData);

    const updateNetworkSignature = await service
      .updateNetwork(parsedData)
      .rpc();
    this.log(updateNetworkSignature);
    const updatedNetwork = await service.getNetworkAccount();
    this.log(updatedNetwork?.fees[0].token.toBase58());
  }
}
