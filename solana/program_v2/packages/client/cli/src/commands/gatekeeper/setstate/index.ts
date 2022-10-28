import {
  airdrop,
  GatekeeperState,
  NetworkService,
  ExtendedCluster,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class SetState extends Command {
  static description = 'Set the states of a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper setState --network [address] --funder [path to keypair] --state [target state] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    gatekeeper: Flags.string({
      char: 'g',
      description: "String representing the gatekeeper's address",
      required: true,
    }),
    state: Flags.integer({
      char: 's',
      description:
        'Desired state of the gatekeeper (0 = Active, 1 = Frozen, 2 = Halted)',
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
    const { flags } = await this.parse(SetState);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    const state = flags.state;
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';
    let targetState = GatekeeperState.Active;
    if (state === 0 || state === 1 || state === 2) {
      if (state === 0) targetState = GatekeeperState.Active;
      if (state === 1) targetState = GatekeeperState.Frozen;
      if (state === 2) targetState = GatekeeperState.Halted;
    }
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

    const networkService = await NetworkService.build(
      authPair.publicKey,
      gatekeeper,
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

    let gatekeeperAccount = await networkService.getGatekeeperAccount();
    const initialState = gatekeeperAccount?.state as GatekeeperState;

    const stateChangeSignature = await networkService
      .setGatekeeperState(targetState)
      .rpc();
    gatekeeperAccount = await networkService.getGatekeeperAccount();
    const newState = gatekeeperAccount?.state as GatekeeperState;
    this.log(`State Change TX Signature: ${stateChangeSignature}`);
    this.log(
      `Gatekeeper state: ${Object.keys(initialState)} -> ${Object.keys(
        newState
      )}`
    );
  }
}
