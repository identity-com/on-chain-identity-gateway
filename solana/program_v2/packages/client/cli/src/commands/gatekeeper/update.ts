import { Command, Flags } from '@oclif/core';
import { parseGatekeeperUpdateData } from '../../util/util';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  UpdateGatekeeperData,
  NetworkService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Update extends Command {
  static description = 'Updates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper update ---network [address] --gatekeeper [address] --data [path to JSON file] --stake [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    network: Flags.string({
      char: 'n',
      description: "String representing the network's address",
      required: true,
    }),
    gatekeeper: Flags.string({
      char: 'g',
      description: "String representing the gatekeeper's address",
      required: true,
    }),
    data: Flags.string({
      char: 'd',
      description:
        'Path to a JSON data file representing the new state of the network',
      required: true,
    }),
    stake: Flags.string({
      char: 's',
      description: "String representing the gatekeeper's staking account",
      required: true,
    }),
    keypair: Flags.string({
      char: 'k',
      description: 'Path to a solana keypair',
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
    const { flags } = await this.parse(Update);

    const gatekeeper = new PublicKey(flags.gatekeeper);
    const stakingAccount = new PublicKey(flags.stake);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';
    const data = await fsPromises.readFile(`${__dirname}/${flags.data}`);
    const updateData = JSON.parse(data.toString()) as UpdateGatekeeperData;

    const localSecretKey = await fsPromises.readFile(
      `${__dirname}/${flags.auth}`
    );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const networkService = await NetworkService.build(
      authorityKeypair.publicKey,
      gatekeeper,
      {
        wallet: authorityWallet,
        clusterType: cluster as ExtendedCluster,
      }
    );

    const parsedData = parseGatekeeperUpdateData(updateData);

    const updateGatekeeperSignature = await networkService
      .updateGatekeeper(parsedData, stakingAccount) // data.json, stakingAccount and autority key?
      .rpc();

    this.log(updateGatekeeperSignature);

    const UpdatedGatekeeper = await networkService.getGatekeeperAccount(
      gatekeeper
    );

    this.log(UpdatedGatekeeper?.tokenFees[0].token.toBase58());
  }
}
