import {
  NetworkService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class Create extends Command {
  static description = 'Creates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper create --network [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    network: Flags.string({
      char: 'n',
      description: "String representing the network's address",
      required: true,
    }),
    keypair: Flags.string({
      char: 'k',
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

    const authKey = await fsPromises.readFile(`${flags.auth}`);
    const authKeyArr = Uint8Array.from(JSON.parse(authKey.toString()));
    const authPair = Keypair.fromSecretKey(authKeyArr);
    const authorityWallet = new Wallet(authPair);
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

    const gatekeeperData = {
      tokenFees: [],
      authThreshold: 1,
      authKeys: [
        {
          flags: 65535,
          key: authPair.publicKey,
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
