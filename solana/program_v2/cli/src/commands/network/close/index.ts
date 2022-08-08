import { Command, Flags } from "@oclif/core";
// import { Keypair } from "@solana/web3.js";

export default class Close extends Command {
  static description = "Closes a gatekeeper network";

  static examples = [
    `$ gateway network close
network closed
`,
  ];

  static flags = {
    program: Flags.string({
      char: "p",
      description: "The program id",
      hidden: false,
      multiple: false,
      required: true,
    }),
    network: Flags.string({
      char: "n",
      description: "The network id",
    }),
    funder: Flags.string({
      char: "f",
      description: "The funder account",
      hidden: false,
      multiple: false,
      required: true,
    }),
  };

  static args = [];

  async run(): Promise<void> {
    this.log("network closed");
  }
}

// programId: PublicKey,
// network: Keypair,
// funder: Keypair,
// networkData: NetworkData
