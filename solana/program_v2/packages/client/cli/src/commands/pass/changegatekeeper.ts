// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import {
  GatekeeperService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@project-serum/anchor';

export default class ChangeGatekeeper extends Command {
  static description = "Changes a pass's assigned gatekeeper";

  static examples = [
    `$ gateway pass changegatekeeper --subject [address] --network [address] --gatekeeper [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    subject: Flags.string({
      char: 's',
      description: 'Public Key to which a pass shall be issued',
      required: true,
    }),
    network: Flags.string({
      char: 'n',
      description: "Public Key representing the network's address",
      required: true,
    }),
    gatekeeper: Flags.string({
      char: 'g',
      description:
        'String representing the new gatekeeper address to which the pass will be assigned',
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
    const { flags } = await this.parse(ChangeGatekeeper);

    const subject = new PublicKey(flags.subject);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const network = new PublicKey(flags.network);
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
    const authorityWallet = new Wallet(authorityKeypair);

    const gatekeeperService = await GatekeeperService.build(
      network,
      gatekeeper,
      { wallet: authorityWallet, clusterType: cluster as ExtendedCluster }
    );

    // TODO: Error occurring 'Error Code: InvalidGatekeeper'

    const account = await GatekeeperService.createPassAddress(subject, network);
    const originalPass = await gatekeeperService.getPassAccount(subject);
    this.log(`Original Pass GK: ${originalPass?.gatekeeper}`);
    const gatekeeperChangeSignature = await gatekeeperService
      .changePassGatekeeper(gatekeeper, account)
      .rpc();
    this.log(`Change Gatekeeper TX Signature: ${gatekeeperChangeSignature}`);
    const updatedPass = await gatekeeperService.getPassAccount(subject);
    this.log(`New Pass Gatekeeper: ${updatedPass?.gatekeeper}`);
  }
}
