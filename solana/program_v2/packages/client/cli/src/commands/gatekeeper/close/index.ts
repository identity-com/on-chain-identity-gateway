import { airdrop, NetworkService } from '@identity.com/gateway-solana-client';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class Close extends Command {
  static description = 'Closes an existing gatekeeper';

  static examples = [
    `$ gateway gatekeeper close --network [address] --gatekeeper [address] --funder [path to keypair] --cluster [cluster type]
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
      char: 'g',
      description: "String representing the gatekeeper's address",
      required: true,
    }),
    funder: Flags.string({
      char: 'f',
      description: 'Path to a solana keypair',
      required: false,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Close);

    const gatekeeper = new PublicKey(flags.gatekeeper);
    const network = new PublicKey(flags.network);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet'
        ? flags.cluster
        : 'localnet';
    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/network-authority.json`
        );

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);

    const authorityWallet = new Wallet(authorityKeypair);
    this.log(`Admin Authority: ${authorityKeypair.publicKey.toBase58()}`);

    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      authorityKeypair.publicKey,
      network
    );

    const networkService = await NetworkService.build(gatekeeper, dataAccount, {
      wallet: authorityWallet,
      clusterType: cluster as ExtendedCluster,
    });

    await airdrop(
      networkService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );
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
