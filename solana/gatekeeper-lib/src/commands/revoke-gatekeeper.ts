import { Command, Flags } from "@oclif/core";
import {
  authorityKeypairFlag,
  clusterFlag,
  gatekeeperPublicKeyFlag,
} from "../util/oclif/flags";
import { Keypair, PublicKey } from "@solana/web3.js";
import { airdropTo } from "../util";
import { GatekeeperNetworkService } from "../service";
import { getConnectionFromEnv } from "../util/oclif/utils";

export default class RevokeGatekeeper extends Command {
  static description = "Revoke a gatekeeper from a network";

  static examples = [
    `$ gateway revoke-gatekeeper tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    authorityKeypair: authorityKeypairFlag(),
    gatekeeperPublicKey: gatekeeperPublicKeyFlag(),
    cluster: clusterFlag(),
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
    const gatekeeperNetwork = flags.authorityKeypair as Keypair;
    this.log(`Revoking: 
      gatekeeper ${gatekeeper.toBase58()}
      from network ${gatekeeperNetwork.publicKey.toBase58()}`);

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
