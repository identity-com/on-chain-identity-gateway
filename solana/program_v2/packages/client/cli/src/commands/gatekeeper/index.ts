import { Command } from '@oclif/core';

export default class Gatekeeper extends Command {
  static description = 'Controls a gatekeeper on a network';

  static examples = [];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log(`USAGE
    $ gateway gatekeeper [COMMAND]
    `);
    this.log(`COMMANDS
    create
    update
    setstate
    close
  `);
  }
}
