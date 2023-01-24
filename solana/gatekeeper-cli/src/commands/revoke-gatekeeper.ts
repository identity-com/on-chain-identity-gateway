import { Command, Flags } from "@oclif/core";
import {
  airdropFlag,
  clusterFlag,
  gatekeeperKeyFlag,
  gatekeeperNetworkKeyFlag,
} from "../util/flags";
import { Keypair, PublicKey } from "@solana/web3.js";
import { airdropTo, GatekeeperNetworkService } from "@identity.com/solana-gatekeeper-lib";
import { getConnectionFromEnv } from "../util/utils";

export default class RevokeGatekeeper extends Command {
  static description = "Revoke a gatekeeper from a network";

  static examples = [
    `$ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperKey: gatekeeperKeyFlag(),
    gatekeeperNetworkKey: gatekeeperNetworkKeyFlag(),
    cluster: clusterFlag(),
    airdrop: airdropFlag,
  };

  static args = [
    {
      name: "address",
      required: true,
      description: "The address of the gatekeeper to revoke from the network",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RevokeGatekeeper);

    const gatekeeper: PublicKey = args.address as PublicKey;
    const gatekeeperNetwork = flags.gatekeeperNetworkKey as Keypair;
    this.log(`Revoking: 
      gatekeeper ${gatekeeper.toBase58()}
      from network ${gatekeeperNetwork.publicKey.toBase58()}`);

    const connection = getConnectionFromEnv(flags.cluster);

    if (flags.airdrop) {
      await airdropTo(
          connection,
          gatekeeperNetwork.publicKey,
          flags.cluster as string
      );
    }

    const networkService = new GatekeeperNetworkService(
        connection,
        gatekeeperNetwork
    );
    const gatekeeperAccount = await networkService
        .revokeGatekeeper(gatekeeper)
        .then((t) => t.send())
        .then((t) => t.confirm());
    this.log(
        `Revoked gatekeeper from network. Gatekeeper account: ${
            gatekeeperAccount
                ? gatekeeperAccount.toBase58()
                : "//Gatekeeper Account Undefined//"
        }`
    );
  }
}
