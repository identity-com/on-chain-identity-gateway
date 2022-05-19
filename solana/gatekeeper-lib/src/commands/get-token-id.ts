import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";

import {
  clusterFlag,
  authorityKeypairFlag,
  gatekeeperNetworkPublicKeyFlag,
} from "../util/oclif/flags";

// ? Should this be renamed? It doesn't seem like the most descriptive class name for what it does

// eslint-disable-next-line no-warning-comments
// TODO: Change this to align with expected command functionality as in gateway-eth-ts
export default class GetTokenID extends Command {
  static description = "Verify a user's identity token";

  static examples = [
    `$ gateway get-token-id tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
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
      description:
        "The public key of the owner for which to verify identity token",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async run(): Promise<void> {}
}
