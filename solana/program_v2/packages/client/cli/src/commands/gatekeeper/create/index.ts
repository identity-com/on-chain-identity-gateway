import { airdrop, NetworkService } from '@identity.com/gateway-solana-client';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class Create extends Command {
  static description = 'Creates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper create --network [address] --funder [path to keypair] --cluster [cluster type]
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
    const { flags } = await this.parse(Create);
    const networkAddress = new PublicKey(flags.network);
    const stakingAccount = Keypair.generate().publicKey;
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(
          `${__dirname}/../../../keypairs/network-authority.json`
        );

    const authKey = await fsPromises.readFile(
      `${__dirname}/../../../keypairs/gatekeeper-authority.json`
    );

    const authKeyArr = Uint8Array.from(JSON.parse(authKey.toString()));
    const authPair = Keypair.fromSecretKey(authKeyArr);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);
    // const gkAddress = authorityKeypair.publicKey;
    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      authorityWallet.publicKey,
      networkAddress
    );
    this.log(`Derived GK Data Account: ${dataAccount}`);

    const networkService = await NetworkService.build(
      authPair.publicKey,
      dataAccount,
      {
        wallet: authorityWallet,
        clusterType: cluster as ExtendedCluster,
      }
    );

    await airdrop(
      networkService.getConnection(),
      authorityWallet.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const gatekeeperData = {
      tokenFees: [],
      authThreshold: 1,
      authKeys: [
        {
          flags: 65535,
          key: authPair.publicKey,
        },
        {
          flags: 65535,
          key: authorityKeypair.publicKey,
        },
      ],
    };
    const gatekeeperSignature = await networkService
      .createGatekeeper(networkAddress, stakingAccount, gatekeeperData)
      .rpc();
    this.log(`Staking Account: ${stakingAccount}`);
    this.log(`Gatekeeper Signature: ${gatekeeperSignature}`);
    const gkAccount = await networkService.getGatekeeperAccount();
    this.log(`AuthKey Flags: ${gkAccount?.authKeys.map((key) => key.flags)}`);
    this.log(`AuthKey: ${gkAccount?.authKeys.map((key) => key.key)}`);
  }
}
