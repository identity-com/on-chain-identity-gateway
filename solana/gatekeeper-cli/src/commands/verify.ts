import { Command, Flags } from "@oclif/core";
import { PublicKey } from "@solana/web3.js";
import { clusterFlag, gatekeeperNetworkPubkeyFlag } from "../util/flags";
import { prettyPrint } from "../util/utils";
import { getConnectionFromEnv } from "../util/utils";
import { findGatewayToken } from "@identity.com/solana-gateway-ts";

export default class Verify extends Command {
  static description = "Verify a gateway token";

  static examples = [
    `$ gateway verify EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv
{
 "issuingGatekeeper": "tgky5YfBseCvqehzsycwCG6rh2udA4w14MxZMnZz9Hp",
 "gatekeeperNetwork": "48V9nmW9awiR9BmihdGhUL3ZpYJ8MCgGeUoSWbtqjicv",
 "owner": "EzZgkwaDrgycsiyGeCVRXXRcieE1fxhGMp829qwj5TMv",
 "state": "ACTIVE",
 "publicKey": "3rNZ6RzH6jLCzFeySVDc8Z82sJkeQ4xi7BCUzjpZBvZr",
 "programId": "gatem74V238djXdzWnJf94Wo1DcnuGkfijbf3AuBhfs"
}
`,
  ];

  static flags = {
    help: Flags.help({ char: "h" }),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "owner",
      required: true,
      description: "The gateway token to revoke",
      // eslint-disable-next-line @typescript-eslint/require-await
      parse: async (input: string): Promise<PublicKey> => new PublicKey(input),
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Verify);

    const gatekeeperNetwork = flags.gatekeeperNetworkKey as PublicKey;

    const connection = getConnectionFromEnv(flags.cluster);

    // ? Would this be the correct type for owner?
    const owner: PublicKey = args.owner as PublicKey;

    this.log(
      `Verifying wallet ${owner.toBase58()} has a gateway token in the network ${gatekeeperNetwork.toBase58()}`
    );
    const token = await findGatewayToken(
      connection,
      args.owner,
      gatekeeperNetwork
    );

    if (!token) {
      this.log("No token found for " + owner.toBase58());
      return;
    }

    this.log(prettyPrint(token));
  }
}
