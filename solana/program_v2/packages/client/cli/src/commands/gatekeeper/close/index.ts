import {
  AdminService,
  airdrop,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Say hello';

  static examples = [
    `$ oex hello friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
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
      char: 'n',
      description: "String representing the gatekeeper's address",
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
    const { flags } = await this.parse(Close);

    const gatekeeper = new PublicKey(flags.gatekeeper);
    const network = new PublicKey(flags.network);

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(`${__dirname}/../../../admin-keypair.json`);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authorityKeypair.publicKey.toBase58()}`);
    const adminService = await AdminService.build(
      network,
      authorityWallet,
      'localnet'
    );
    const networkAccount = await adminService.getNetworkAccount(network);

    this.log(`Gatekeepers: ${networkAccount?.gatekeepers[0]}`);

    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      authorityKeypair.publicKey,
      network
    );
    this.log(`New GK Address derivation: ${dataAccount}`);

    const networkService = await NetworkService.build(
      gatekeeper,
      dataAccount,
      authorityWallet,
      'localnet'
    );

    this.log('service built');
    await airdrop(
      networkService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );
    this.log('airdrop completed');
    const gatekeeperAccount = await networkService.getGatekeeperAccount(
      dataAccount
    );
    this.log(gatekeeperAccount?.gatekeeperNetwork.toBase58());

    const closedGatekeeperSignature = await networkService
      .closeGatekeeper(network)
      .rpc();
    this.log(`Transaction Signature: ${closedGatekeeperSignature}`);
  }
}
