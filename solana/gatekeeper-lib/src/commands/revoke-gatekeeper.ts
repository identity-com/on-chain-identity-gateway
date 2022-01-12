import { Command, flags } from "@oclif/command";
import {
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkKeyFlag,
} from "../util/oclif/flags";
import { Keypair, PublicKey } from "@solana/web3.js";
import { airdropTo, getConnection } from "../util";
import { GatekeeperNetworkService } from "../service";

export default class RevokeGatekeeper extends Command {
  static description = "Revoke a gatekeeper from a network";

  static examples = [
    `$ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
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
      description: "The address of the gatekeeper to revoke from the network",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(RevokeGatekeeper);

    const gatekeeper: PublicKey = args.address;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;
    this.log(`Revoking: 
      gatekeeper ${gatekeeper.toBase58()}
      from network ${gatekeeperNetwork.publicKey.toBase58()}`);

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
    const gatekeeperAccount = await networkService
      .revokeGatekeeper(gatekeeper)
      .then((t) => t.confirm());
    this.log(
      `Revoked gatekeeper from network. Gatekeeper account: ${gatekeeperAccount.toBase58()}`
    );
  }
}
