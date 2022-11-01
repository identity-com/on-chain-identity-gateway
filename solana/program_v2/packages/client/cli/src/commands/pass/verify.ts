// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { findGatewayTokenByAccount } from '@identity.com/gateway-solana-client';
import {
  ExtendedCluster,
  getConnectionByCluster,
} from '@identity.com/gateway-solana-client/dist/lib/connection';
import { Command, Flags } from '@oclif/core';
import { PublicKey } from '@solana/web3.js';

export default class Verify extends Command {
  static description = 'Verifies a gateway pass';

  static examples = [
    `$ gateway pass verify --pass [address] --network [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    pass: Flags.string({
      char: 's',
      description: 'The address of the issued pass',
      required: true,
    }),
    network: Flags.string({
      char: 'n',
      description: "String representing the network's address",
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
    const { flags } = await this.parse(Verify);

    const pass = new PublicKey(flags.pass);
    const network = new PublicKey(flags.network);
    const cluster =
      flags.cluster === 'localnet' ||
      flags.cluster === 'devnet' ||
      flags.cluster === 'mainnet' ||
      flags.cluster === 'civicnet' ||
      flags.cluster === 'testnet'
        ? flags.cluster
        : 'localnet';
    const connection = getConnectionByCluster(cluster as ExtendedCluster);
    const acct = await findGatewayTokenByAccount(connection, network, pass);
    if (!acct) {
      return this.error('Invalid pass account');
    }
    this.log(`Pass Verified — Current Pass State: ${acct.state}`);
  }
}
