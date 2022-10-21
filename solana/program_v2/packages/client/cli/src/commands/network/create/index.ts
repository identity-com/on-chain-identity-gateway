import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AdminService, airdrop } from '@identity.com/gateway-solana-client';
import fsPromises from 'node:fs/promises';
export default class Create extends Command {
  static description = 'Creates a gatekeeper network';

  static examples = [
    `$ gateway network create --address ./network.json --funder ./funder-keypair.json --cluster localnet
Latest Blockhash: [blockhash]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    address: Flags.string({
      char: 'a',
      description: 'Path to network data',
      required: false,
    }),
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    this.log('run');
    const { flags } = await this.parse(Create);
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : null;

    const privateKey = localSecretKey
      ? Uint8Array.from(JSON.parse(localSecretKey.toString()))
      : null;
    const authorityKeypair = privateKey
      ? Keypair.fromSecretKey(privateKey)
      : Keypair.generate();

    const authority = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authority.publicKey.toBase58()}`);

    const [dataAccount] = await AdminService.createNetworkAddress(
      authority.publicKey,
      0
    );
    this.log(`Network Address: ${dataAccount}`);
    const adminService = await AdminService.build(
      dataAccount,
      authority,
      'localnet'
    );
    await airdrop(
      adminService.getConnection(),
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const networkSignature = await adminService.createNetwork().rpc();

    this.log(`Network Signature: ${networkSignature}`);
  }
}
