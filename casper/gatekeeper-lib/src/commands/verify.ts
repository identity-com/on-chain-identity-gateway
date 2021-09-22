import { findGatewayTokens } from "@identity.com/solana-gateway-ts";
import { Command, flags } from "@oclif/command";
import { Keypair, PublicKey } from "@casper/web3.js";
import { getConnection } from "../util";
import {
  clusterFlag,
  gatekeeperNetworkKeyFlag,
  gatekeeperNetworkPubkeyFlag,
} from "../util/oclif/flags";
import { prettyPrint } from "../util/token";

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

    const connection = getConnection(flags.cluster);

    this.log(
      `Verifying wallet ${args.owner.toBase58()} has a gateway token in the network ${gatekeeperNetwork.toBase58()}`
    );
    const tokens = await findGatewayTokens(
      connection,
      args.owner,
      gatekeeperNetwork,
      true
    );

    if (!tokens.length) {
      this.log("No token found for " + args.owner.toBase58());
      return;
    }

    tokens.map((t) => this.log(prettyPrint(t)));
  }
}
