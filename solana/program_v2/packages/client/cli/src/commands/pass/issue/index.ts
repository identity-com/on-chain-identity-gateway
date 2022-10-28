// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import {
  airdrop,
  GatekeeperService,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@project-serum/anchor';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';

export default class Issue extends Command {
  static description = 'Issues a gateway pass';

  static examples = [
    `$ gateway pass issue --subject [address] --network [address] --gatekeeper [address] --funder [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    subject: Flags.string({
      char: 's',
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
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Issue);

    const subject = new PublicKey(flags.subject);
    const network = new PublicKey(flags.network);
    const gatekeeper = new PublicKey(flags.gatekeeper);
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

    const authorityWallet = new Wallet(authorityKeypair);

    const gatekeeperService = await GatekeeperService.build(
      network,
      gatekeeper,
      { wallet: authorityWallet, clusterType: cluster as ExtendedCluster }
    );

    await airdrop(
      gatekeeperService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const account = await GatekeeperService.createPassAddress(subject, network);

    const issuedPassSignature = await gatekeeperService
      .issue(account, subject)
      .rpc();
    const issuedPass = await gatekeeperService.getPassAccount(subject);
    this.log(`Issued Pass TX Signature: ${issuedPassSignature}`);
    this.log(`Issued Pass Time: ${issuedPass?.issueTime}`);
  }
}
