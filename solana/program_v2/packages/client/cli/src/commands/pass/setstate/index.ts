// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import {
  GatekeeperService,
  PassState,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@project-serum/anchor';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';

export default class SetState extends Command {
  static description = 'Sets the state of a gateway pass';

  static examples = [
    `$ gateway pass setstate --subject [address] --network [address] --gatekeeper [address] --funder [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    subject: Flags.string({
      char: 'S',
      description: 'Pubkey to which a pass shall be issued',
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
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: true,
    }),
    state: Flags.integer({
      char: 's',
      description:
        'The target pass state (0 = Active, 1 = Frozen, 2 = Revoked)',
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
    const { flags } = await this.parse(SetState);

    const subject = new PublicKey(flags.subject);
    const network = new PublicKey(flags.network);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const state = flags.state;
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet'
        ? flags.cluster
        : 'localnet';
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/gatekeeper-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    let targetState = PassState.Active;
    if (state === 0 || state === 1 || state === 2) {
      if (state === 0) targetState = PassState.Active;
      if (state === 1) targetState = PassState.Frozen;
      if (state === 2) targetState = PassState.Revoked;

      const authorityWallet = new Wallet(authorityKeypair);

      const gatekeeperService = await GatekeeperService.build(
        network,
        gatekeeper,
        { wallet: authorityWallet, clusterType: cluster as ExtendedCluster }
      );
      const account = await GatekeeperService.createPassAddress(
        subject,
        network
      );
      const modifiedPassSignature = await gatekeeperService
        .setState(targetState, account)
        .rpc();

      this.log(`Pass SetState Signature: ${modifiedPassSignature}`);
    }
  }
}
