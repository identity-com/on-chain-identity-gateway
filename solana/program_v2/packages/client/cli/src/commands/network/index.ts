import { Command } from '@oclif/core';

export default class Network extends Command {
  static description = 'Controls a gatekeeper network';

  static examples = [];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log(`USAGE
    $ gateway network [COMMAND]
    `);
    this.log(`COMMANDS
    create
    update
    close
  `);
  }
}
