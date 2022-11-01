import { Command } from '@oclif/core';

export default class Pass extends Command {
  static description = 'Controls the gateway pass interface';

  static examples = [];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log(`USAGE
    $ gateway pass [COMMAND]
    `);
    this.log(`COMMANDS
    issue
    changegatekeeper
    refresh
    setdata
    setstate
    verify
  `);
  }
}
