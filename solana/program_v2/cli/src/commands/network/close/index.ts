import { Command } from "@oclif/core";

export default class Close extends Command {
  static description = "Closes a gatekeeper network";

  static examples = [
    `$ gateway network close
network closed
`,
  ];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log("network closed");
  }
}
