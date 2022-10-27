import {
  airdrop,
  NetworkService,
  GatekeeperState,
} from '@identity.com/gateway-solana-client';
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

    const localSecretKey = flags.funder
      ? await fsPromises.readFile(`${__dirname}/${flags.funder}`)
      : await fsPromises.readFile(`${__dirname}/../../../admin-keypair.json`);

    const privateKey = Uint8Array.from(JSON.parse(localSecretKey.toString()));
    const authorityKeypair = Keypair.fromSecretKey(privateKey);
    const authorityWallet = new Wallet(authorityKeypair);

    const gkAddress = Keypair.generate().publicKey;
    const [dataAccount] = await NetworkService.createGatekeeperAddress(
      authorityWallet.publicKey,
      networkAddress
    );
    this.log(`Generated GK Address: ${gkAddress}`);
    this.log(`Derived GK Data Account: ${dataAccount}`);

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

    const gatekeeperData = {
      tokenFees: [],
      authThreshold: 1,
      authKeys: [
        {
          flags: 4095,
          key: gkAddress,
        },
      ],
    };

    await networkService
      .createGatekeeper(networkAddress, stakingAccount, gatekeeperData)
      .rpc();

    let gatekeeperAccount = await networkService.getGatekeeperAccount();
    const initialState = gatekeeperAccount?.state;

    await networkService.setGatekeeperState(GatekeeperState.Frozen).rpc();
    this.log(`Gatekeeper state set to Frozen`);

    gatekeeperAccount = await networkService.getGatekeeperAccount();
    const newState = gatekeeperAccount?.state;

    this.log(`Gatekeeper state: ${initialState} -> ${newState}`);
  }
}
