// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import {
  GatekeeperService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@coral-xyz/anchor';

export default class SetData extends Command {
  static description = 'Sets the data for a gateway pass';

  static examples = [
    `$ gateway pass setdata --subject [address] --network [address] --gatekeeper [address] --data [path to data] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    subject: Flags.string({
      char: 's',
      description: 'Address to which a pass shall be issued',
      required: true,
    }),
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
      chaf: 'd',
      description: 'Path to new pass and network data',
      required: true,
    }),
    keypair: Flags.string({
      char: 'k',
      description: 'Path to a solana keypair',
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
    const { flags } = await this.parse(SetData);

    const subject = new PublicKey(flags.subject);
    const network = new PublicKey(flags.network);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';

    const localSecretKey = await fsPromises.readFile(`${flags.keypair}`);
    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const dataFile = JSON.parse(
      (await fsPromises.readFile(`${flags.data}`)).toString()
    );
    const gatekeeperData = Uint8Array.from(dataFile.gatekeeperData);
    const networkData = Uint8Array.from(dataFile.networkData);

    const gatekeeperService = await GatekeeperService.build(
      network,
      gatekeeper,
      { wallet: authorityWallet, clusterType: cluster as ExtendedCluster }
    );

    const account = await GatekeeperService.createPassAddress(subject, network);
    const modifiedPassSignature = await gatekeeperService
      .setPassData(account, gatekeeperData, networkData)
      .rpc();
    this.log(`Pass SetState Signature: ${modifiedPassSignature}`);
  }
}
