import { Command, Flags } from '@oclif/core';

export default class Update extends Command {
  static description = 'Updates a gatekeeper on an existing network';

  static examples = [
    `$ gateway gatekeeper update --network [address] --funder [path_to_funder_key]
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
    const { flags } = await this.parse(Update);

    this.log(`network: ${flags.network}`);
  }
}
