import { airdrop, NetworkService } from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class Create extends Command {
  static description = 'Creates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper create --network [address] --funder [path_to_funder_key]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    network: Flags.string({
      char: 'n',
      description: "String representing the network's address",
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
    const { flags } = await this.parse(Create);
    const networkAddress = new PublicKey(flags.network);
    const stakingAccount = Keypair.generate().publicKey;
    const gkAddress = Keypair.generate().publicKey;

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(`${__dirname}/gk-keypair.json`);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      authorityWallet.publicKey,
      networkAddress
    );
    this.log(`Gatekeeper Address: ${dataAccount}`);

    const networkService = await NetworkService.build(
      gkAddress,
      dataAccount,
      authorityWallet,
      'localnet'
    );
    await airdrop(
      networkService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const gatekeeperSignature = await networkService
      .createGatekeeper(networkAddress, stakingAccount)
      .rpc();

    this.log(`Gatekeeper Signature: ${gatekeeperSignature}`);
  }
}
