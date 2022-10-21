import {
  AdminService,
  // AdminService,
  airdrop,
  NetworkService,
} from '@identity.com/gateway-solana-client';
import { Command, Flags } from '@oclif/core';
import { Wallet } from '@project-serum/anchor';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js';

export default class Create extends Command {
  static description = 'Creates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper create --network [address] --funder ./funder-keypair.json
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
    const authority = Keypair.generate();
    const networkAddress = new PublicKey(flags.network);
    const wallet = new Wallet(authority);
    const stakingAccount = Keypair.generate().publicKey;

    const [gatekeeperAddress] = await NetworkService.createGatekeeperAddress(
      authority.publicKey,
      networkAddress
    );
    this.log(`Gatekeeper Address: ${gatekeeperAddress}`);

    // const adminService = await AdminService.build(
    //   networkAddress,
    //   wallet,
    //   'localnet'
    // );
    const dataAccount = await AdminService.fetchProgram({
      connection: new Connection('http://localhost:8899'),
      publicKey: networkAddress,
    });
    this.log(`Network Data Account: ${dataAccount.programId}`);

    const networkService = await NetworkService.build(
      gatekeeperAddress,
      dataAccount.programId,
      wallet,
      'localnet'
    );
    await airdrop(
      networkService.getConnection(),
      authority.publicKey,
      LAMPORTS_PER_SOL * 2
    );

    const gatekeeperSignature = await networkService
      .createGatekeeper(dataAccount.programId, stakingAccount)
      .rpc();

    this.log(`Gatekeeper Signature: ${gatekeeperSignature}`);
  }
}
