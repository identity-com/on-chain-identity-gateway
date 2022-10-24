import { Command, Flags } from '@oclif/core';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
// import * as anchor from '@project-serum/anchor';
import { AdminService, airdrop } from '@identity.com/gateway-solana-client';
import { Wallet } from '@project-serum/anchor';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Closes a gatekeeper network';

  static examples = [
    `$ gateway network close
network closed
`,
  ];

  static flags = {
    // TODO: Change to required: true
    program: Flags.string({
      char: 'p',
      description: 'The program id',
      hidden: false,
      multiple: false,
      required: false,
    }),
    network: Flags.string({
      char: 'n',
      description: 'The network id',
      required: true,
    }),
    // TODO: Change to required: true
    funder: Flags.string({
      char: 'f',
      description: 'The funder account',
      hidden: false,
      multiple: false,
      required: false,
    }),
    // TODO: Is this necessary?
    cluster: Flags.string({
      char: 'c',
      description: 'The type of cluster',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    this.log('run');
    const { flags } = await this.parse(Close);

    // 'FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe';
    // const programId = new PublicKey(flags.program);
    const network = new PublicKey(flags.network);

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(`${__dirname}/test-keypair.json`);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authorityKeypair.publicKey.toBase58()}`);

    const [dataAccount] = await AdminService.createNetworkAddress(
      authorityKeypair.publicKey,
      0
    );

    const service = await AdminService.build(
      dataAccount,
      authorityWallet,
      'localnet'
    );

    this.log('before airdrop');
    await airdrop(
      service.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL
    );

    const networkAccount = await service.getNetworkAccount(network);
    this.log(`Network Account: ${networkAccount}`);

    const closedNetworkSignature = await service.closeNetwork().rpc();
    this.log(`Transaction Signature: ${closedNetworkSignature}`);
  }
}

// programId: PublicKey,
// network: Keypair,
// funder: Keypair,
// networkData: NetworkData
