import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";

import {
  clusterFlag,
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
} from "../util/oclif/flags";

// eslint-disable-next-line no-warning-comments
// TODO: Change this to align with expected command functionality as in gateway-eth-ts
export default class Blacklist extends Command {
  static description = "Blacklist a user's public key";

  static examples = [
    `$ gateway blacklist tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKeypair: authorityKeypairFlag(),
    gatekeeperNetworkPublicKey: gatekeeperNetworkPublicKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The public key of the user to blacklist",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async run(): Promise<void> {}
}
