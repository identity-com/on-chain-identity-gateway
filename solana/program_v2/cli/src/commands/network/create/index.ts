import { Command } from "@oclif/core";

export default class Create extends Command {
  static description = "Creates a gatekeeper network";

  static examples = [
    `$ gateway network create
network created!
`,
  ];

  static flags = {};

  static args = [];

  async run(): Promise<void> {
    this.log("network created!");
  }
}
