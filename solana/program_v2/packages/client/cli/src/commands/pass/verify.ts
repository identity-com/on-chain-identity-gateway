// import { GatekeeperService } from '@identity.com/gateway-solana-client';
import { findGatewayToken } from '@identity.com/gateway-solana-client';
import {
  ExtendedCluster,
  getConnectionByCluster,
} from '@identity.com/gateway-solana-client/dist/lib/connection';
import { Command, Flags } from '@oclif/core';
import { PublicKey } from '@solana/web3.js';

export default class Verify extends Command {
  static description = 'Verifies a gateway pass';

  static examples = [
    `$ gateway pass verify --subject [address] --network [address] --keypair [path to keypair] --cluster [cluster type]
`,
  ];

  static flags = {
    help: Flags.help({ char: 'h' }),
    subject: Flags.string({
      char: 's',
      description: 'The address to check for a gateway pass',
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

    const subject = new PublicKey(flags.subject);
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
    const acct = await findGatewayToken(connection, network, subject);
    if (!acct) {
      return this.log('No gateway pass associated with subject');
    }
    this.log(`Pass Verified — Current Pass State: ${acct.state}`);
  }
}
