import {
  ExtendedCluster,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@coral-xyz/anchor';
import { Keypair, PublicKey } from '@solana/web3.js';
import { readKeyFromFile } from '../../util/util';

export default class Create extends Command {
  static description = 'Creates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper create --network [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    networkKeypair: Flags.string({
      char: 'n',
      description: 'Path to the network keypair',
      required: true,
    }),
    payerKeypair: Flags.string({
      char: 'p',
      description: 'Path to the payer keypair',
      required: true,
    }),
    gatekeeper: Flags.string({
      char: 'g',
      description: "String representing the gatekeeper's address",
      required: true,
    }),
    cluster: Flags.string({
      char: 'c',
      description: 'The cluster you wish to use',
      required: true,
    }),
    token: Flags.string({
      char: 't',
      description: 'A supported SPL token to accept fees in',
      required: true,
    }),
    fees: Flags.string({
      char: 'f',
      description: 'The percentage split between the network and gatekeeper',
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const gatekeeperAddress = new PublicKey(flags.gatekeeper);
    const stakingAccount = Keypair.generate().publicKey;
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';

    const token = flags.token;
    const fee = parseInt(flags.fees);

    const networkAuthPair = readKeyFromFile(flags.networkKeypair);

    const payerAuthPair = readKeyFromFile(flags.payerKeypair);

    const authorityWallet = new Wallet(payerAuthPair);
    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      gatekeeperAddress,
      networkAuthPair.publicKey
    );
    this.log(`Derived GK Data Account: ${dataAccount}`);

    const networkService = await NetworkService.build(
      networkAuthPair.publicKey,
      gatekeeperAddress,
      dataAccount,
      {
        wallet: authorityWallet,
        clusterType: cluster as ExtendedCluster,
      }
    );

    const gatekeeperData = {
      tokenFees: [
        {
          token: new PublicKey(token),
          issue: fee,
          refresh: fee,
          expire: fee,
          verify: fee,
        },
      ],
      authThreshold: 1,
      authKeys: [
        {
          flags: 65535,
          key: networkAuthPair.publicKey,
        },
      ],
      supportedTokens: [{ key: new PublicKey(token) }],
    };

    const gatekeeperSignature = await networkService
      .createGatekeeper(stakingAccount, gatekeeperData)
      .withPartialSigners(networkAuthPair)
      .rpc();

    this.log(`Staking Account: ${stakingAccount}`);
    this.log(`Gatekeeper Signature: ${gatekeeperSignature}`);
    const gkAccount = await networkService.getGatekeeperAccount();
    this.log(`AuthKey Flags: ${gkAccount?.authKeys.map((key) => key.flags)}`);
    this.log(`AuthKey: ${gkAccount?.authKeys.map((key) => key.key)}`);
  }
}
