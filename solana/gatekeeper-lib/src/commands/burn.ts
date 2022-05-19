import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";

import {
  clusterFlag,
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
} from "../util/oclif/flags";

// eslint-disable-next-line no-warning-comments
// TODO: Change this to align with expected command functionality as in gateway-eth-ts
export default class Burn extends Command {
  // ? What does this command do? I would've put something in description but don't know how to describe
  static description = "";

  static examples = [
    `$ gateway burn tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  // ? Same as earlier... Not sure what to put for description

  static args = [
    {
      name: "address",
      required: true,
      description: "",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async run(): Promise<void> {}
}
