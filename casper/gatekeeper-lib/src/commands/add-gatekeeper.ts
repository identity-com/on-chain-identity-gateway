import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@solana/web3.js";

import { airdropTo, getConnection } from "../util";
import { GatekeeperNetworkService } from "../service/GatekeeperNetworkService";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkKeyFlag,
} from "../util/oclif/flags";

export default class AddGatekeeper extends Command {
  static description = "Add a gatekeeper to a network";

  static examples = [
    `$ gateway add-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkKeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address of the gatekeeper to add to the network",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(AddGatekeeper);

    const gatekeeper: PublicKey = args.address;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;
    this.log(`Adding:
      gatekeeper ${gatekeeper.toBase58()} 
      to network ${gatekeeperNetwork.publicKey.toBase58()}`);

    const connection = getConnection(flags.cluster);

    await airdropTo(
      connection,
      gatekeeperNetwork.publicKey,
      flags.cluster as string
    );

    const networkService = new GatekeeperNetworkService(
      connection,
      gatekeeperNetwork,
      gatekeeperNetwork
    );
    const gatekeeperAccount = await networkService.addGatekeeper(gatekeeper);
    this.log(
      `Added gatekeeper to network. Gatekeeper account: ${gatekeeperAccount.toBase58()}`
    );
  }
}
