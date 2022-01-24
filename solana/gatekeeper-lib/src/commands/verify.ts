import { Command, flags } from "@oclif/command";
import { PublicKey } from "@solana/web3.js";
import { clusterFlag, gatekeeperNetworkPubkeyFlag } from "../util/oclif/flags";
import { prettyPrint } from "../util/token";
import { getConnectionFromEnv } from "../util/oclif/utils";
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
    help: flags.help({ char: "h" }),
    gatekeeperNetworkKey: gatekeeperNetworkPubkeyFlag(),
    cluster: clusterFlag(),
  };

  static args = [
    {
      name: "owner",
      required: true,
      description: "The gateway token to revoke",
      parse: (input: string) => new PublicKey(input),
    },
  ];

  async run() {
    const { args, flags } = this.parse(Verify);

    const gatekeeperNetwork = flags.gatekeeperNetworkKey as PublicKey;

    const connection = getConnectionFromEnv(flags.cluster);

    this.log(
      `Verifying wallet ${args.owner.toBase58()} has a gateway token in the network ${gatekeeperNetwork.toBase58()}`
    );
    const token = await findGatewayToken(
      connection,
      args.owner,
      gatekeeperNetwork
    );

    if (!token) {
      this.log("No token found for " + args.owner.toBase58());
      return;
    }

    this.log(prettyPrint(token));
  }
}
