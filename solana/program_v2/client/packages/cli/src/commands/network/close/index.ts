import { Command, Flags } from '@oclif/core';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
// import * as anchor from "@project-serum/anchor";
import { GatewayService } from 'solana/program_v2/src/AdminService';
import { airdrop } from '@identity.com/solana-gateway-ts-v2/src/lib/utils';
import { Wallet } from '@project-serum/anchor';

export default class Close extends Command {
  static description = 'Closes a gatekeeper network';

  static examples = [
    `$ gateway network close
network closed
`,
  ];

  static flags = {
    // TODO: Change to required: true
    program: Flags.string({
      char: 'p',
      description: 'The program id',
      hidden: false,
      multiple: false,
      required: false,
    }),
    network: Flags.string({
      char: 'n',
      description: 'The network id',
    }),
    // TODO: Change to required: true
    funder: Flags.string({
      char: 'f',
      description: 'The funder account',
      hidden: false,
      multiple: false,
      required: false,
    }),
    // TODO: Is this necessary?
    cluster: Flags.string({
      char: 'c',
      description: 'The type of cluster',
      required: false,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    const { flags } = await this.parse(Close);

    // TODO: Remove second option... necessary to pass program ID in with cli
    const programId = flags.program
      ? flags.program
      : 'FSgDgZoNxiUarRWJYrMDWcsZycNyEXaME5i3ZXPnhrWe';

    // eslint-disable-next-line unicorn/prefer-module
    const localSecretKey = require(flags.funder);
    const funder = localSecretKey
      ? Keypair.fromSecretKey(Buffer.from(localSecretKey))
      : Keypair.generate();

    // TODO: If program ID and and network match, and maybe a secret key? then close the network

    const [network] = await GatewayService.createNetworkAddress(programId);

    const gatewayService = await GatewayService.build(
      network,
      new Wallet(funder),
      flags.cluster ? flags.cluster : 'localnet'
    );

    this.log('before airdrop');
    await airdrop(
      gatewayService.getConnection(),
      funder.publicKey,
      LAMPORTS_PER_SOL
    );
    this.log('after airdrop');

    const closedNetworkSignature = await gatewayService.closeNetwork().rpc();
    this.log(`--${closedNetworkSignature}`);
    this.log('network closed');
  }
}

// programId: PublicKey,
// network: Keypair,
// funder: Keypair,
// networkData: NetworkData
