// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';
import { Wallet } from '@project-serum/anchor';

export default class SetData extends Command {
  static description = 'Expires a gateway pass';

  static examples = [
    `$ oex hello friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
  ];

  static flags = {
    subject: Flags.string({
      char: 's',
      description: 'Pubkey to which a pass shall be issued',
      required: false,
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
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(SetData);

    const subject = flags.subject
      ? new PublicKey(flags.subject)
      : new PublicKey('F75rU4fRqxiqG6gJCjkqaPHAARbmc276Y6ENrCTLPs6G');
    const network = new PublicKey(flags.network);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/gatekeeper-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);

    const dataFile = JSON.parse(
      (await fsPromises.readFile(`${__dirname}/${flags.data}`)).toString()
    );
    const gatekeeperData = Uint8Array.from(dataFile.gatekeeperData);
    const networkData = Uint8Array.from(dataFile.networkData);
    // this.log(`${passData}, ${networkData}`);
    const gatekeeperService = await GatekeeperService.build(
      network,
      gatekeeper,
      authorityWallet,
      'localnet'
    );

    const account = await GatekeeperService.createPassAddress(subject, network);
    const modifiedPassSignature = await gatekeeperService
      .setPassData(account, gatekeeperData, networkData)
      .rpc();

    this.log(`Pass SetState Signature: ${modifiedPassSignature}`);
  }
}
