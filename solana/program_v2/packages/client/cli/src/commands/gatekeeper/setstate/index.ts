import {
  airdrop,
  GatekeeperState,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { ExtendedCluster } from '@identity.com/gateway-solana-client/dist/lib/connection';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fsPromises from 'node:fs/promises';

export default class SetState extends Command {
  static description = 'Set the states of a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper setState --network [address] --funder [path_to_funder_key]
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
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(SetState);
    const gatekeeper = new PublicKey(flags.gatekeeper);
    let state = flags.state;
    if (state === 0 || state === 1 || state === 2) {
      if (state === 0) {
        state = GatekeeperState.Active;
      }
      if (state === 1) {
        state = GatekeeperState.Frozen;
      }
      if (state === 2) {
        state = GatekeeperState.Halted;
      }
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
        clusterType: 'localnet' as ExtendedCluster,
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
      .setGatekeeperState(state)
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
