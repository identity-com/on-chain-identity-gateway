import { Command, Flags } from "@oclif/core";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo } from "../util";
import { GatekeeperNetworkService } from "../service";
import {
  clusterFlag,
  authorityKeypairFlag,
  gatekeeperPublicKeyFlag,
} from "../util/oclif/flags";
import { getConnectionFromEnv } from "../util/oclif/utils";

export default class Burn extends Command {
  // ? What does this command do? I would've put something in description but don't know how to describe
  static description = "";

  static examples = [
    `$ gateway burn tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperPublicKey: gatekeeperPublicKeyFlag(),
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

  // eslint-disable-next-line no-warning-comments
  // TODO: Change this to align with expected command functionality
  async run(): Promise<void> {
    const { args, flags } = await this.parse(Burn);

    const gatekeeper: PublicKey = args.address as PublicKey;
    const gatekeeperNetwork = flags.authorityKeypair as Keypair;
    this.log(`Adding:
      gatekeeper ${gatekeeper.toBase58()} 
      to network ${gatekeeperNetwork.publicKey.toBase58()}`);

    const connection = getConnectionFromEnv(flags.cluster);

    await airdropTo(
      connection,
      gatekeeperNetwork.publicKey,
      flags.cluster as string
    );

    const networkService = new GatekeeperNetworkService(
      connection,
      gatekeeperNetwork
    );
    const gatekeeperAccount = await networkService
      .addGatekeeper(gatekeeper)
      .then((t) => t.send())
      .then((t) => t.confirm());
    this.log(
      `Added gatekeeper to network. Gatekeeper account: ${
        gatekeeperAccount
          ? gatekeeperAccount?.toBase58()
          : "//GatekeeperAccount was undefined//"
      }`
    );
  }
}
