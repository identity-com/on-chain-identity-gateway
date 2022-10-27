// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@project-serum/anchor';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';

export default class ChangeGatekeeper extends Command {
  static description = 'Expires a gateway pass';

  static examples = [
    `$ oex hello friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
  ];

  static flags = {
    subject: Flags.string({
      char: 's',
      description: 'Public Key to which a pass shall be issued',
      required: false,
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
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(ChangeGatekeeper);

    const subject = flags.subject
      ? new PublicKey(flags.subject)
      : new PublicKey('F75rU4fRqxiqG6gJCjkqaPHAARbmc276Y6ENrCTLPs6G');
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const network = new PublicKey(flags.network);
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
      { wallet: authorityWallet, clusterType: 'localnet' as ExtendedCluster }
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
